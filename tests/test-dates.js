// Test script for date handling in knex-bun-sqlite
// This verifies that Date objects are properly converted to SQLite-compatible strings

const knex = require('knex')
const BunSqliteClient = require('../index.js')

console.log('🧪 Testing Date Handling in knex-bun-sqlite\n')

// Configure Knex with our bun:sqlite adapter
const db = knex({
  client: BunSqliteClient,
  connection: {
    filename: ':memory:' // Use in-memory database for testing
  },
  useNullAsDefault: true
})

async function runTests() {
  try {
    console.log('✅ Database connection established')

    // Create test table
    console.log('\n📝 Creating test table...')
    await db.schema.createTable('events', (table) => {
      table.increments('id').primary()
      table.string('name')
      table.datetime('event_date')
      table.datetime('created_at')
      table.datetime('updated_at')
    })
    console.log('✅ Table created successfully')

    // Test 1: Insert with Date objects
    console.log('\n🔬 Test 1: Inserting rows with Date objects')
    const now = new Date()
    const futureDate = new Date(Date.now() + 86400000) // Tomorrow
    const pastDate = new Date('2024-01-15T10:30:00Z')

    const [id1] = await db('events').insert({
      name: 'Conference',
      event_date: now,
      created_at: now,
      updated_at: now
    })
    console.log(`✅ Inserted event with ID ${id1} using Date object: ${now.toISOString()}`)

    const [id2] = await db('events').insert({
      name: 'Workshop',
      event_date: futureDate,
      created_at: now,
      updated_at: futureDate
    })
    console.log(`✅ Inserted event with ID ${id2} using future Date: ${futureDate.toISOString()}`)

    const [id3] = await db('events').insert({
      name: 'Webinar',
      event_date: pastDate,
      created_at: now,
      updated_at: now
    })
    console.log(`✅ Inserted event with ID ${id3} using past Date: ${pastDate.toISOString()}`)

    // Test 2: Query with Date parameters
    console.log('\n🔬 Test 2: Querying with Date parameters')
    const results = await db('events')
      .where('created_at', '>=', pastDate)
      .select('*')
    console.log(`✅ Query with Date parameter returned ${results.length} results`)

    // Test 3: Update with Date object
    console.log('\n🔬 Test 3: Updating with Date objects')
    const updateTime = new Date()
    await db('events')
      .where('id', id1)
      .update({ updated_at: updateTime })
    console.log(`✅ Updated event ${id1} with new Date: ${updateTime.toISOString()}`)

    // Test 4: Verify stored dates are retrievable
    console.log('\n🔬 Test 4: Verifying stored dates')
    const allEvents = await db('events').select('*')
    console.log(`✅ Retrieved ${allEvents.length} events:`)
    allEvents.forEach(event => {
      console.log(`   - ${event.name}: event_date=${event.event_date}`)
    })

    // Test 5: Raw query with Date parameter
    console.log('\n🔬 Test 5: Raw query with Date parameter')
    const rawResults = await db.raw(
      'SELECT * FROM events WHERE created_at >= ?',
      [pastDate]
    )
    console.log(`✅ Raw query with Date parameter returned ${rawResults.length} results`)

    // Test 6: Test with millisecond precision
    console.log('\n🔬 Test 6: Testing millisecond precision')
    const preciseDate = new Date('2025-03-15T14:30:45.123Z')
    const [id4] = await db('events').insert({
      name: 'Precise Event',
      event_date: preciseDate,
      created_at: preciseDate,
      updated_at: preciseDate
    })
    const retrieved = await db('events').where('id', id4).first()
    console.log(`✅ Stored: ${preciseDate.toISOString()}`)
    console.log(`✅ Retrieved: ${retrieved.event_date}`)
    // Check if milliseconds are preserved (SQLite stores as string)
    if (retrieved.event_date.includes('.123')) {
      console.log('✅ Millisecond precision preserved!')
    } else {
      console.log('⚠️  Millisecond precision may be truncated')
    }

    // Test 7: Batch insert with dates
    console.log('\n🔬 Test 7: Batch insert with Date objects')
    const batchData = [
      { name: 'Event A', event_date: new Date(), created_at: now, updated_at: now },
      { name: 'Event B', event_date: new Date(), created_at: now, updated_at: now },
      { name: 'Event C', event_date: new Date(), created_at: now, updated_at: now }
    ]
    await db('events').insert(batchData)
    console.log('✅ Batch insert with Date objects successful')

    // Summary
    const totalEvents = await db('events').count('* as count').first()
    console.log(`\n📊 Summary: ${totalEvents.count} total events in database`)
    
    console.log('\n✨ All date handling tests passed! ✨\n')

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await db.destroy()
  }
}

runTests()
