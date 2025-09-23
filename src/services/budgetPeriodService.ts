import { supabase } from '../lib/supabase'
import type {
  BudgetPeriod,
  BudgetCategory,
  Transaction,
  InsertBudgetCategory,
  InsertTransaction
} from '../types/database'
import { CoreCategories, CategoryColors, CategoryIcons, CategoryType } from '../types'

export class BudgetPeriodService {

  /**
   * Check if we need to create a new budget period and do so automatically
   */
  static async checkAndCreateNewPeriod(): Promise<BudgetPeriod | null> {
    console.log(`[${new Date().toISOString()}] 🔍 Getting user authentication...`)

    const { data: { user }, error } = await supabase.auth.getUser()
    console.log(`[${new Date().toISOString()}] 🔍 Auth response:`, { hasUser: !!user, error: error?.message })

    if (error) {
      console.error(`[${new Date().toISOString()}] ❌ Auth error:`, error)
      throw error
    }

    if (!user) {
      console.error(`[${new Date().toISOString()}] ❌ No user found`)
      throw new Error('Not authenticated')
    }

    console.log(`[${new Date().toISOString()}] ✅ User authenticated: ${user.email}`)

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    console.log(`[${new Date().toISOString()}] 📅 Current period: ${currentYear}/${currentMonth}`)

    // Get active period
    console.log(`[${new Date().toISOString()}] 🔍 Looking for active budget period...`)
    const { data: activePeriod, error: periodError } = await supabase
      .from('budget_periods')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (periodError) {
      console.error(`[${new Date().toISOString()}] ❌ Error fetching active period:`, periodError)
      throw periodError
    }

    console.log(`[${new Date().toISOString()}] 📊 Active period found:`, !!activePeriod, activePeriod ? `${activePeriod.year}/${activePeriod.month}` : 'none')

    // If no active period or month changed, create new one
    if (!activePeriod ||
        activePeriod.year !== currentYear ||
        activePeriod.month !== currentMonth) {
      console.log(`[${new Date().toISOString()}] 🆕 Creating new budget period...`)
      return await this.createNewBudgetPeriod(currentYear, currentMonth, activePeriod)
    }

    console.log(`[${new Date().toISOString()}] ✅ Using existing active period`)
    return activePeriod
  }

  /**
   * Create a new budget period
   */
  static async createNewBudgetPeriod(
    year: number,
    month: number,
    previousPeriod?: BudgetPeriod | null
  ): Promise<BudgetPeriod> {
    console.log(`[${new Date().toISOString()}] 🔍 Getting user for new period creation...`)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    console.log(`[${new Date().toISOString()}] ✅ User authenticated for period creation: ${user.email}`)

    // Deactivate any existing active period
    if (previousPeriod) {
      console.log(`[${new Date().toISOString()}] 🔄 Deactivating previous period: ${previousPeriod.id}`)
      const { error } = await supabase
        .from('budget_periods')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (error) {
        console.error(`[${new Date().toISOString()}] ❌ Error deactivating previous period:`, error)
        throw error
      }
      console.log(`[${new Date().toISOString()}] ✅ Previous period deactivated`)
    }

    // Create date range for the month
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0) // Last day of month
    console.log(`[${new Date().toISOString()}] 📅 Creating period for ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)

    // Create new period
    console.log(`[${new Date().toISOString()}] 💾 Inserting new budget period into database...`)
    const { data: newPeriod, error } = await supabase
      .from('budget_periods')
      .insert({
        user_id: user.id,
        year,
        month,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        is_active: true,
        total_budget: 0
      })
      .select()
      .single()

    if (error) {
      console.error(`[${new Date().toISOString()}] ❌ Error creating new period:`, error)
      throw error
    }
    console.log(`[${new Date().toISOString()}] ✅ New period created with ID: ${newPeriod.id}`)

    // Copy categories from previous period if exists, otherwise create core categories
    if (previousPeriod) {
      console.log(`[${new Date().toISOString()}] 🔄 Copying categories from previous period...`)
      await this.copyCategoriesToNewPeriod(previousPeriod.id, newPeriod.id)
      console.log(`[${new Date().toISOString()}] ✅ Categories copied successfully`)
    } else {
      console.log(`[${new Date().toISOString()}] 🆕 Creating core categories for new user...`)
      await this.createCoreCategories(newPeriod.id)
      console.log(`[${new Date().toISOString()}] ✅ Core categories created successfully`)
    }

    console.log(`[${new Date().toISOString()}] 🎉 Budget period creation completed`)
    return newPeriod
  }

  /**
   * Copy categories from previous period with reset spent amounts
   */
  static async copyCategoriesToNewPeriod(
    fromPeriodId: string,
    toPeriodId: string
  ): Promise<void> {
    // Get categories from previous period
    const { data: previousCategories } = await supabase
      .from('budget_categories')
      .select('*')
      .eq('period_id', fromPeriodId)

    if (previousCategories && previousCategories.length > 0) {
      // Create new categories with reset spent amounts
      const newCategories: InsertBudgetCategory[] = previousCategories.map(cat => ({
        period_id: toPeriodId,
        category: cat.category,
        allocated: cat.allocated,
        spent: 0, // Reset spending for new period
        color: cat.color,
        icon: cat.icon,
        is_custom: cat.is_custom
      }))

      const { error } = await supabase
        .from('budget_categories')
        .insert(newCategories)

      if (error) throw error
    }
  }

  /**
   * Create core budget categories for a new period
   */
  static async createCoreCategories(periodId: string): Promise<void> {
    const coreCategories: InsertBudgetCategory[] = CoreCategories.map(category => ({
      period_id: periodId,
      category: category,
      allocated: 0, // Start with $0 allocated - users can set their own amounts
      spent: 0,
      color: CategoryColors[category],
      icon: CategoryIcons[category],
      is_custom: false // Core categories are not custom
    }))

    const { error } = await supabase
      .from('budget_categories')
      .insert(coreCategories)

    if (error) {
      console.error(`[${new Date().toISOString()}] ❌ Error creating core categories:`, error)
      throw error
    }

    console.log(`[${new Date().toISOString()}] ✅ Created ${CoreCategories.length} core categories`)
  }

  /**
   * Get current active budget period with full data
   */
  static async getCurrentPeriod(): Promise<{
    period: BudgetPeriod
    categories: BudgetCategory[]
    transactions: Transaction[]
  } | null> {
    console.log('[BudgetPeriodService] getCurrentPeriod - Getting user...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.error('[BudgetPeriodService] Auth error:', authError)
      throw authError
    }
    if (!user) {
      console.error('[BudgetPeriodService] No user found')
      throw new Error('Not authenticated')
    }

    console.log('[BudgetPeriodService] Getting current period for user:', user.email)
    console.log('[BudgetPeriodService] Querying budget_periods with user_id:', user.id)
    let { data: period, error: periodError } = await supabase
      .from('budget_periods')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    console.log('[BudgetPeriodService] Period query result:', {
      period,
      periodError: periodError ? {
        message: periodError.message,
        code: periodError.code,
        details: periodError.details,
        hint: periodError.hint
      } : null
    })

    if (periodError) {
      console.error('[BudgetPeriodService] Error fetching period:', periodError)
      throw periodError
    }

    if (!period) {
      console.log('[BudgetPeriodService] No current period found, checking for any period')
      // First check if there's ANY period for this user
      const { data: anyPeriod, error: anyPeriodError } = await supabase
        .from('budget_periods')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (anyPeriod) {
        console.log('[BudgetPeriodService] Found existing period, updating to active:', anyPeriod.id)
        // Update it to be active
        await supabase
          .from('budget_periods')
          .update({ is_active: true })
          .eq('id', anyPeriod.id)

        // Use this period
        period = anyPeriod
      } else {
        console.log('[BudgetPeriodService] No periods exist, creating new one')
        // Try to get or create a period
        const newPeriod = await this.checkAndCreateNewPeriod()
        if (!newPeriod) {
          console.log('[BudgetPeriodService] Failed to create new period')
          return null
        }
        console.log('[BudgetPeriodService] Created period:', newPeriod.id)
        // Recursively call getCurrentPeriod to get the full data
        return this.getCurrentPeriod()
      }
    }

    console.log('[BudgetPeriodService] Found period:', period.id)

    // Get categories and transactions for this period
    const [categoriesResult, transactionsResult] = await Promise.all([
      supabase
        .from('budget_categories')
        .select('*')
        .eq('period_id', period.id)
        .order('category'),
      supabase
        .from('transactions')
        .select('*')
        .eq('period_id', period.id)
        .order('transaction_date', { ascending: false })
    ])

    console.log('[BudgetPeriodService] Categories found:', categoriesResult.data?.length || 0)
    console.log('[BudgetPeriodService] Categories:', categoriesResult.data?.map(c => ({ category: c.category, is_custom: c.is_custom })))

    return {
      period,
      categories: categoriesResult.data || [],
      transactions: transactionsResult.data || []
    }
  }

  /**
   * Get historical periods summary (for performance)
   */
  static async getHistoricalPeriods(limit?: number): Promise<Array<{
    period: BudgetPeriod
    totalSpent: number
    categoryCount: number
  }>> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get user tier to determine limit
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .maybeSingle()

    const effectiveLimit = subscription?.tier === 'paid' ? limit : 2

    const query = supabase
      .from('budget_periods')
      .select(`
        *,
        budget_categories(
          spent
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', false)
      .order('year', { ascending: false })
      .order('month', { ascending: false })

    if (effectiveLimit) {
      query.limit(effectiveLimit)
    }

    const { data: periods } = await query

    return (periods || []).map(period => ({
      period: {
        id: period.id,
        user_id: period.user_id,
        year: period.year,
        month: period.month,
        start_date: period.start_date,
        end_date: period.end_date,
        total_budget: period.total_budget,
        is_active: period.is_active,
        created_at: period.created_at
      },
      totalSpent: (period.budget_categories as any[])?.reduce((sum, cat) => sum + (cat.spent || 0), 0) || 0,
      categoryCount: (period.budget_categories as any[])?.length || 0
    }))
  }

  /**
   * Get full data for a specific historical period
   */
  static async getHistoricalPeriodData(periodId: string): Promise<{
    period: BudgetPeriod
    categories: BudgetCategory[]
    transactions: Transaction[]
  } | null> {
    const { data: period } = await supabase
      .from('budget_periods')
      .select('*')
      .eq('id', periodId)
      .maybeSingle()

    if (!period) return null

    // Get categories and transactions for this period
    const [categoriesResult, transactionsResult] = await Promise.all([
      supabase
        .from('budget_categories')
        .select('*')
        .eq('period_id', period.id)
        .order('category'),
      supabase
        .from('transactions')
        .select('*')
        .eq('period_id', period.id)
        .order('transaction_date', { ascending: false })
    ])

    return {
      period,
      categories: categoriesResult.data || [],
      transactions: transactionsResult.data || []
    }
  }

  /**
   * Add transaction to current period
   */
  static async addTransaction(transaction: Omit<InsertTransaction, 'user_id' | 'period_id'>): Promise<Transaction> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get current active period
    const currentPeriod = await this.checkAndCreateNewPeriod()
    if (!currentPeriod) throw new Error('Could not create/find active period')

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...transaction,
        user_id: user.id,
        period_id: currentPeriod.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Add or update budget category
   */
  static async upsertBudgetCategory(category: Omit<InsertBudgetCategory, 'period_id'>): Promise<BudgetCategory> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get current active period
    const currentPeriod = await this.checkAndCreateNewPeriod()
    if (!currentPeriod) throw new Error('Could not create/find active period')

    const { data, error } = await supabase
      .from('budget_categories')
      .upsert({
        ...category,
        period_id: currentPeriod.id
      }, {
        onConflict: 'period_id,category'
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Ensure core categories exist for current period
   */
  static async ensureCoreCategories(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get current active period
    const currentPeriod = await this.checkAndCreateNewPeriod()
    if (!currentPeriod) throw new Error('Could not create/find active period')

    // Get existing categories for this period
    const { data: existingCategories } = await supabase
      .from('budget_categories')
      .select('category')
      .eq('period_id', currentPeriod.id)

    const existingCategoryNames = existingCategories?.map(cat => cat.category) || []

    // Find missing core categories
    const missingCoreCategories = CoreCategories.filter(
      coreCategory => !existingCategoryNames.includes(coreCategory)
    )

    if (missingCoreCategories.length > 0) {
      console.log(`[${new Date().toISOString()}] 🆕 Adding ${missingCoreCategories.length} missing core categories:`, missingCoreCategories)

      // Create missing core categories
      const newCategories: InsertBudgetCategory[] = missingCoreCategories.map(category => ({
        period_id: currentPeriod.id,
        category: category,
        allocated: 0, // Start with $0 allocated - users can set their own amounts
        spent: 0,
        color: CategoryColors[category],
        icon: CategoryIcons[category],
        is_custom: false // Core categories are not custom
      }))

      const { error } = await supabase
        .from('budget_categories')
        .insert(newCategories)

      if (error) {
        console.error(`[${new Date().toISOString()}] ❌ Error adding missing core categories:`, error)
        throw error
      }

      console.log(`[${new Date().toISOString()}] ✅ Added ${missingCoreCategories.length} missing core categories`)
    } else {
      console.log(`[${new Date().toISOString()}] ✅ All core categories already exist`)
    }
  }

  /**
   * Get user subscription tier
   */
  static async getUserTier(): Promise<'free' | 'paid'> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 'free'

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .maybeSingle()

    return (subscription?.tier as 'free' | 'paid') || 'free'
  }
}

export default BudgetPeriodService