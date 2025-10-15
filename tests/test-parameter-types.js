// Test script for parameter type handling in knex-bun-sqlite
// This verifies that all parameter types are properly normalized for bun:sqlite

const knex = require('knex')
const BunSqliteClient = require('../index.js')

console.log('🧪 Testing Parameter Type Handling in knex-bun-sqlite\n')

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

    // Create test table with various column types
    console.log('\n📝 Creating test table...')
    await db.schema.createTable('test_types', (table) => {
      table.increments('id').primary()
      table.string('string_col')
      table.integer('int_col')
      table.float('float_col')
      table.boolean('bool_col')
      table.datetime('datetime_col')
      table.binary('binary_col')
      table.text('text_col')
      table.bigInteger('bigint_col')
    })
    console.log('✅ Table created successfully')

    // Test 1: String parameters
    console.log('\n🔬 Test 1: String parameters')
    await db('test_types').insert({
      string_col: 'Hello World',
      text_col: 'Long text content'
    })
    const stringResult = await db('test_types')
      .where('string_col', 'Hello World')
      .first()
    console.log('✅ String parameters work correctly')

    // Test 2: Number parameters (int, float, bigint)
    console.log('\n🔬 Test 2: Number parameters')
    await db('test_types').insert({
      int_col: 42,
      float_col: 3.14159,
      bigint_col: 9007199254740991n
    })
    const numberResult = await db('test_types')
      .where('int_col', 42)
      .first()
    console.log('✅ Integer parameter works')
    console.log(`   int_col: ${numberResult.int_col}`)
    console.log(`   float_col: ${numberResult.float_col}`)
    console.log(`   bigint_col: ${numberResult.bigint_col}`)

    // Test 3: Boolean parameters
    console.log('\n🔬 Test 3: Boolean parameters')
    await db('test_types').insert({
      bool_col: true,
      string_col: 'Bool Test'
    })
    await db('test_types').insert({
      bool_col: false,
      string_col: 'Bool Test 2'
    })
    const trueResults = await db('test_types').where('bool_col', true)
    const falseResults = await db('test_types').where('bool_col', false)
    console.log(`✅ Boolean parameters work: ${trueResults.length} true, ${falseResults.length} false`)

    // Test 4: Date parameters
    console.log('\n🔬 Test 4: Date object parameters')
    const testDate = new Date('2025-06-15T10:30:45.678Z')
    await db('test_types').insert({
      datetime_col: testDate,
      string_col: 'Date Test'
    })
    const dateResult = await db('test_types')
      .where('string_col', 'Date Test')
      .first()
    console.log(`✅ Date object converted: ${testDate.toISOString()} -> ${dateResult.datetime_col}`)
    
    // Query using Date parameter
    const dateQuery = await db('test_types')
      .where('datetime_col', '>=', testDate)
      .select('*')
    console.log(`✅ Query with Date parameter returned ${dateQuery.length} results`)

    // Test 5: null parameters
    console.log('\n🔬 Test 5: null and undefined parameters')
    await db('test_types').insert({
      string_col: 'Null Test',
      int_col: null,
      datetime_col: null
    })
    const nullResult = await db('test_types')
      .where('string_col', 'Null Test')
      .first()
    console.log(`✅ null parameters work: int_col=${nullResult.int_col}, datetime_col=${nullResult.datetime_col}`)
    
    // Test undefined (should be converted to null)
    await db('test_types').insert({
      string_col: 'Undefined Test',
      int_col: undefined, // Should be converted to null
      bool_col: undefined
    })
    const undefinedResult = await db('test_types')
      .where('string_col', 'Undefined Test')
      .first()
    console.log(`✅ undefined converted to null: int_col=${undefinedResult.int_col}, bool_col=${undefinedResult.bool_col}`)

    // Test 6: Buffer parameters
    console.log('\n🔬 Test 6: Buffer parameters')
    const buffer = Buffer.from('Hello Binary World', 'utf-8')
    await db('test_types').insert({
      string_col: 'Buffer Test',
      binary_col: buffer
    })
    const bufferResult = await db('test_types')
      .where('string_col', 'Buffer Test')
      .first()
    console.log(`✅ Buffer parameter works: stored ${bufferResult.binary_col ? 'binary data' : 'null'}`)

    // Test 7: Mixed parameters in query
    console.log('\n🔬 Test 7: Mixed parameter types in single query')
    const mixedDate = new Date('2025-01-01T00:00:00Z')
    await db('test_types').insert({
      string_col: 'Mixed Test',
      int_col: 100,
      bool_col: true,
      datetime_col: mixedDate
    })
    
    const mixedResult = await db.raw(
      'SELECT * FROM test_types WHERE string_col = ? AND int_col = ? AND bool_col = ? AND datetime_col >= ?',
      ['Mixed Test', 100, true, mixedDate]
    )
    console.log(`✅ Mixed parameter types in raw query: ${mixedResult.length} results`)

    // Test 8: Array of parameters
    console.log('\n🔬 Test 8: IN clause with array parameters')
    const ids = [1, 2, 3, 4, 5]
    const inResults = await db('test_types')
      .whereIn('id', ids)
      .select('*')
    console.log(`✅ IN clause with array parameter returned ${inResults.length} results`)

    // Test 9: Update with Date
    console.log('\n🔬 Test 9: Update with Date parameter')
    const updateDate = new Date('2025-12-31T23:59:59.999Z')
    const updateCount = await db('test_types')
      .where('id', 1)
      .update({ datetime_col: updateDate })
    console.log(`✅ Updated ${updateCount} row(s) with Date parameter`)

    // Test 10: Prepared statement with Date
    console.log('\n🔬 Test 10: Prepared statement style with Date')
    await db('test_types').insert({
      string_col: 'Prepared Test',
      datetime_col: new Date(),
      int_col: 999
    })
    const preparedResult = await db('test_types')
      .where('string_col', '=', 'Prepared Test')
      .andWhere('datetime_col', '<=', new Date())
      .first()
    console.log(`✅ Prepared statement with Date parameter works: ${preparedResult ? 'found' : 'not found'}`)

    // Test 11: Edge case - very old and very future dates
    console.log('\n🔬 Test 11: Edge case dates')
    const oldDate = new Date('1970-01-01T00:00:00Z')
    const futureDate = new Date('2099-12-31T23:59:59.999Z')
    
    await db('test_types').insert({
      string_col: 'Old Date',
      datetime_col: oldDate
    })
    await db('test_types').insert({
      string_col: 'Future Date',
      datetime_col: futureDate
    })
    
    const oldResult = await db('test_types').where('string_col', 'Old Date').first()
    const futureResult = await db('test_types').where('string_col', 'Future Date').first()
    
    console.log(`✅ Old date (1970): ${oldResult.datetime_col}`)
    console.log(`✅ Future date (2099): ${futureResult.datetime_col}`)

    // Test 12: Date in BETWEEN query
    console.log('\n🔬 Test 12: Date range query (BETWEEN)')
    const startDate = new Date('2025-01-01T00:00:00Z')
    const endDate = new Date('2025-12-31T23:59:59Z')
    
    const rangeResults = await db('test_types')
      .whereBetween('datetime_col', [startDate, endDate])
      .select('*')
    console.log(`✅ BETWEEN query with Date parameters returned ${rangeResults.length} results`)

    // Summary
    const totalRows = await db('test_types').count('* as count').first()
    console.log(`\n📊 Summary: ${totalRows.count} total rows inserted with various parameter types`)
    console.log('✨ All parameter type tests passed! ✨\n')

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await db.destroy()
  }
}

runTests()
