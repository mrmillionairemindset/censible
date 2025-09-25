// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16' as any,
  httpClient: Stripe.createFetchHttpClient(),
})

Deno.serve(async (req) => {
  try {
    // Get the raw body as text
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return new Response('No signature provided', { status: 400 })
    }

    // Verify webhook signature
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not set')
      return new Response('Webhook secret not configured', { status: 500 })
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    console.log(`Received Stripe webhook: ${event.type}`)

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Log the event (idempotent)
    await supabaseAdmin.rpc('log_stripe_event', {
      stripe_event_id_param: event.id,
      event_type_param: event.type,
      event_data_param: event.data
    })

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await supabaseAdmin.rpc('update_household_subscription', {
          stripe_customer_id_param: subscription.customer as string,
          subscription_status_param: subscription.status,
          stripe_subscription_id_param: subscription.id,
          current_period_start_param: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end_param: new Date(subscription.current_period_end * 1000).toISOString(),
          canceled_at_param: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
        })

        console.log(`Updated household subscription for customer: ${subscription.customer}`)
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription' && session.subscription) {
          // Get the full subscription object
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

          await supabaseAdmin.rpc('update_household_subscription', {
            stripe_customer_id_param: session.customer as string,
            subscription_status_param: subscription.status,
            stripe_subscription_id_param: subscription.id,
            current_period_start_param: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end_param: new Date(subscription.current_period_end * 1000).toISOString(),
            canceled_at_param: null
          })

          console.log(`Checkout completed for customer: ${session.customer}`)
        }
        break
      }

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        if (invoice.subscription) {
          // Get the subscription to update status
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)

          await supabaseAdmin.rpc('update_household_subscription', {
            stripe_customer_id_param: invoice.customer as string,
            subscription_status_param: subscription.status,
            stripe_subscription_id_param: subscription.id,
            current_period_start_param: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end_param: new Date(subscription.current_period_end * 1000).toISOString(),
            canceled_at_param: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null
          })

          console.log(`Payment ${event.type} for customer: ${invoice.customer}`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Mark event as processed
    await supabaseAdmin
      .from('stripe_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('stripe_event_id', event.id)

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
