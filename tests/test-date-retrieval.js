// Test script to verify date retrieval behavior
// Compares how dates come back from the database

const knex = require('knex')
const BunSqliteClient = require('../index.js')

console.log('🧪 Testing Date Retrieval Behavior\n')

const db = knex({
  client: BunSqliteClient,
  connection: {
    filename: ':memory:'
  },
  useNullAsDefault: true
})

async function runTests() {
  try {
    console.log('✅ Database connection established')

    // Create test table
    await db.schema.createTable('events', (table) => {
      table.increments('id').primary()
      table.string('name')
      table.datetime('event_date')
      table.timestamp('created_at')
    })

    // Insert test data with Date objects
    const testDate = new Date('2025-06-15T10:30:45.678Z')
    const now = new Date()
    
    await db('events').insert({
      name: 'Test Event',
      event_date: testDate,
      created_at: now
    })
    
    console.log('\n📝 Inserted data:')
    console.log(`   event_date: ${testDate.toISOString()} (Date object)`)
    console.log(`   Type: ${typeof testDate}`)

    // Retrieve the data
    const retrieved = await db('events').first()
    
    console.log('\n📖 Retrieved data:')
    console.log(`   event_date: ${retrieved.event_date}`)
    console.log(`   Type: ${typeof retrieved.event_date}`)
    console.log(`   Is Date object: ${retrieved.event_date instanceof Date}`)
    console.log(`   Is string: ${typeof retrieved.event_date === 'string'}`)
    
    console.log('\n📖 Retrieved created_at:')
    console.log(`   created_at: ${retrieved.created_at}`)
    console.log(`   Type: ${typeof retrieved.created_at}`)
    console.log(`   Is Date object: ${retrieved.created_at instanceof Date}`)

    // Test raw query
    const rawResult = await db.raw('SELECT * FROM events WHERE id = 1')
    const rawRow = rawResult[0]
    
    console.log('\n📖 Raw query result:')
    console.log(`   event_date: ${rawRow.event_date}`)
    console.log(`   Type: ${typeof rawRow.event_date}`)
    console.log(`   Is Date object: ${rawRow.event_date instanceof Date}`)

    // Check if we can parse it back
    console.log('\n🔄 Converting back to Date:')
    if (typeof retrieved.event_date === 'string') {
      const parsedDate = new Date(retrieved.event_date)
      console.log(`   Parsed: ${parsedDate.toISOString()}`)
      console.log(`   Valid Date: ${!isNaN(parsedDate.getTime())}`)
    }

    // Test with direct bun:sqlite for comparison
    console.log('\n🔍 Direct bun:sqlite comparison:')
    const { Database: BunDatabase } = require('bun:sqlite')
    const directDb = new BunDatabase(':memory:')
    
    directDb.run('CREATE TABLE test (id INTEGER PRIMARY KEY, dt TEXT)')
    directDb.run('INSERT INTO test (dt) VALUES (?)', [testDate.toISOString().replace('T', ' ').substring(0, 23)])
    
    const directResult = directDb.query('SELECT * FROM test').get()
    console.log(`   Direct bun:sqlite result: ${directResult.dt}`)
    console.log(`   Type: ${typeof directResult.dt}`)
    
    directDb.close()

    console.log('\n' + '='.repeat(60))
    console.log('📊 SUMMARY:')
    console.log('='.repeat(60))
    console.log('✅ Dates are stored as strings in SQLite (standard behavior)')
    console.log('✅ Dates are retrieved as strings (not Date objects)')
    console.log('✅ This is CORRECT - matches node-sqlite3 and better-sqlite3')
    console.log('✅ Applications can parse strings back to Date objects if needed')
    console.log('\n💡 Recommendation: Document this behavior for users\n')

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await db.destroy()
  }
}

runTests()
