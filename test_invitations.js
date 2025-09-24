const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testInvitationSystem() {
  try {
    await client.connect();
    console.log('🔧 Testing invitation system...');

    // Test 1: Direct code generation
    const directCode = await client.query(`
      SELECT array_to_string(
        ARRAY(
          SELECT substring('ABCDEFGHJKMNPQRSTUVWXYZ23456789' from floor(random() * 30 + 1)::int for 1)
          FROM generate_series(1, 6)
        ),
        ''
      ) as code
    `);
    console.log('🎲 Generated code:', directCode.rows[0].code);

    // Test 2: Create invitation manually
    const household = await client.query('SELECT id FROM households LIMIT 1');
    const user = await client.query('SELECT id FROM auth.users LIMIT 1');

    if (household.rows.length > 0 && user.rows.length > 0) {
      console.log('\n💾 Creating invitation...');
      const invitation = await client.query(`
        INSERT INTO invitation_codes (code, household_id, invited_by, email, role, expires_at)
        VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '48 hours')
        RETURNING code, expires_at, email, role
      `, [
        directCode.rows[0].code,
        household.rows[0].id,
        user.rows[0].id,
        'test@example.com',
        'viewer'
      ]);

      console.log('✅ Invitation created:', invitation.rows[0]);

      // Test 3: Query invitations
      const invitations = await client.query(`
        SELECT code, email, role, expires_at, created_at
        FROM invitation_codes
        WHERE household_id = $1
        ORDER BY created_at DESC
        LIMIT 5
      `, [household.rows[0].id]);

      console.log('\n📋 Recent invitations:');
      invitations.rows.forEach((inv, i) => {
        console.log(`  ${i + 1}. ${inv.code} - ${inv.email} (${inv.role})`);
        console.log(`     Expires: ${inv.expires_at}`);
      });
    }

    console.log('\n✅ Invitation system is working!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await client.end();
  }
}

testInvitationSystem();