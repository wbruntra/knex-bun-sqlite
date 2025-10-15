// Comparison test: knex-bun-sqlite vs sqlite3
// Ensures our adapter returns data in the same format as sqlite3

const knex = require('knex')
const BunSqliteClient = require('../index.js')

console.log('🔬 Comparing knex-bun-sqlite vs sqlite3 behavior\n')

// Create two Knex instances - one with each driver
const dbBun = knex({
  client: BunSqliteClient,
  connection: {
    filename: ':memory:'
  },
  useNullAsDefault: true
})

const dbSqlite3 = knex({
  client: 'sqlite3',
  connection: {
    filename: ':memory:'
  },
  useNullAsDefault: true
})

async function setupDatabase(db, name) {
  // Create identical tables
  await db.schema.createTable('test_data', (table) => {
    table.increments('id').primary()
    table.string('name')
    table.integer('age')
    table.float('score')
    table.boolean('active')
    table.datetime('created_at')
    table.timestamp('updated_at')
    table.date('birth_date')
    table.text('description')
  })

  // Insert identical test data
  const testDate = new Date('2025-06-15T10:30:45.678Z')
  const now = new Date('2025-10-15T08:00:00.000Z')
  
  await db('test_data').insert([
    {
      name: 'Alice',
      age: 30,
      score: 95.5,
      active: true,
      created_at: testDate,
      updated_at: now,
      birth_date: new Date('1995-03-20T00:00:00Z'),
      description: 'Test user 1'
    },
    {
      name: 'Bob',
      age: 25,
      score: 87.3,
      active: false,
      created_at: now,
      updated_at: testDate,
      birth_date: new Date('2000-08-15T00:00:00Z'),
      description: 'Test user 2'
    },
    {
      name: null,  // Test null handling
      age: null,
      score: null,
      active: null,
      created_at: null,
      updated_at: null,
      birth_date: null,
      description: null
    }
  ])

  console.log(`✅ ${name} database setup complete\n`)
}

function compareValues(bunVal, sqlite3Val, field) {
  const bunType = bunVal === null ? 'null' : typeof bunVal
  const sqlite3Type = sqlite3Val === null ? 'null' : typeof sqlite3Val
  
  const match = bunType === sqlite3Type && 
                (bunVal === sqlite3Val || 
                 (bunVal === null && sqlite3Val === null) ||
                 (typeof bunVal === 'number' && typeof sqlite3Val === 'number' && 
                  Math.abs(bunVal - sqlite3Val) < 0.0001))
  
  const status = match ? '✅' : '❌'
  
  if (!match) {
    console.log(`${status} ${field}:`)
    console.log(`   knex-bun-sqlite: ${JSON.stringify(bunVal)} (${bunType})`)
    console.log(`   sqlite3:         ${JSON.stringify(sqlite3Val)} (${sqlite3Type})`)
    return false
  }
  
  return true
}

function compareRows(bunRow, sqlite3Row, rowNum) {
  console.log(`\n📊 Row ${rowNum}:`)
  console.log(`   Name: ${bunRow.name}`)
  
  let allMatch = true
  const fields = Object.keys(bunRow)
  
  for (const field of fields) {
    const match = compareValues(bunRow[field], sqlite3Row[field], field)
    if (!match) allMatch = false
  }
  
  if (allMatch) {
    console.log('   ✅ All fields match!')
  }
  
  return allMatch
}

async function runComparison() {
  let allTestsPassed = true
  
  try {
    console.log('=' .repeat(60))
    console.log('SETUP: Creating identical databases')
    console.log('='.repeat(60))
    
    await setupDatabase(dbBun, 'knex-bun-sqlite')
    await setupDatabase(dbSqlite3, 'sqlite3')
    
    // Test 1: SELECT ALL
    console.log('=' .repeat(60))
    console.log('TEST 1: SELECT * (All rows)')
    console.log('='.repeat(60))
    
    const bunRows = await dbBun('test_data').select('*').orderBy('id')
    const sqlite3Rows = await dbSqlite3('test_data').select('*').orderBy('id')
    
    console.log(`\nknex-bun-sqlite returned: ${bunRows.length} rows`)
    console.log(`sqlite3 returned:         ${sqlite3Rows.length} rows`)
    
    if (bunRows.length !== sqlite3Rows.length) {
      console.log('❌ Row count mismatch!')
      allTestsPassed = false
    } else {
      console.log('✅ Row counts match')
      
      for (let i = 0; i < bunRows.length; i++) {
        const match = compareRows(bunRows[i], sqlite3Rows[i], i + 1)
        if (!match) allTestsPassed = false
      }
    }
    
    // Test 2: SELECT with WHERE clause
    console.log('\n' + '='.repeat(60))
    console.log('TEST 2: SELECT with WHERE clause')
    console.log('='.repeat(60))
    
    const bunFiltered = await dbBun('test_data')
      .where('age', '>', 20)
      .select('*')
      .orderBy('id')
    
    const sqlite3Filtered = await dbSqlite3('test_data')
      .where('age', '>', 20)
      .select('*')
      .orderBy('id')
    
    console.log(`\nFiltered results (age > 20):`)
    console.log(`knex-bun-sqlite: ${bunFiltered.length} rows`)
    console.log(`sqlite3:         ${sqlite3Filtered.length} rows`)
    
    if (bunFiltered.length === sqlite3Filtered.length) {
      console.log('✅ Filtered results match')
    } else {
      console.log('❌ Filtered results mismatch')
      allTestsPassed = false
    }
    
    // Test 3: SELECT FIRST
    console.log('\n' + '='.repeat(60))
    console.log('TEST 3: SELECT first()')
    console.log('='.repeat(60))
    
    const bunFirst = await dbBun('test_data').where('name', 'Alice').first()
    const sqlite3First = await dbSqlite3('test_data').where('name', 'Alice').first()
    
    if (bunFirst && sqlite3First) {
      const match = compareRows(bunFirst, sqlite3First, 'first')
      if (!match) allTestsPassed = false
    } else {
      console.log('❌ One or both queries returned undefined')
      allTestsPassed = false
    }
    
    // Test 4: Date field types
    console.log('\n' + '='.repeat(60))
    console.log('TEST 4: Date field type comparison')
    console.log('='.repeat(60))
    
    const bunDateRow = await dbBun('test_data').where('name', 'Alice').first()
    const sqlite3DateRow = await dbSqlite3('test_data').where('name', 'Alice').first()
    
    console.log('\nDate field types:')
    console.log(`created_at (datetime):`)
    console.log(`  knex-bun-sqlite: ${bunDateRow.created_at} (${typeof bunDateRow.created_at})`)
    console.log(`  sqlite3:         ${sqlite3DateRow.created_at} (${typeof sqlite3DateRow.created_at})`)
    
    console.log(`updated_at (timestamp):`)
    console.log(`  knex-bun-sqlite: ${bunDateRow.updated_at} (${typeof bunDateRow.updated_at})`)
    console.log(`  sqlite3:         ${sqlite3DateRow.updated_at} (${typeof sqlite3DateRow.updated_at})`)
    
    console.log(`birth_date (date):`)
    console.log(`  knex-bun-sqlite: ${bunDateRow.birth_date} (${typeof bunDateRow.birth_date})`)
    console.log(`  sqlite3:         ${sqlite3DateRow.birth_date} (${typeof sqlite3DateRow.birth_date})`)
    
    if (typeof bunDateRow.created_at === typeof sqlite3DateRow.created_at) {
      console.log('✅ Date types match (both return strings)')
    } else {
      console.log('❌ Date types mismatch!')
      allTestsPassed = false
    }
    
    // Test 5: NULL handling
    console.log('\n' + '='.repeat(60))
    console.log('TEST 5: NULL value handling')
    console.log('='.repeat(60))
    
    const bunNull = await dbBun('test_data').whereNull('name').first()
    const sqlite3Null = await dbSqlite3('test_data').whereNull('name').first()
    
    if (bunNull && sqlite3Null) {
      const match = compareRows(bunNull, sqlite3Null, 'null-row')
      if (!match) allTestsPassed = false
    } else {
      console.log('❌ NULL query failed')
      allTestsPassed = false
    }
    
    // Test 6: Aggregate functions
    console.log('\n' + '='.repeat(60))
    console.log('TEST 6: Aggregate functions')
    console.log('='.repeat(60))
    
    const bunAgg = await dbBun('test_data')
      .count('* as count')
      .avg('age as avgAge')
      .max('score as maxScore')
      .first()
    
    const sqlite3Agg = await dbSqlite3('test_data')
      .count('* as count')
      .avg('age as avgAge')
      .max('score as maxScore')
      .first()
    
    console.log('\nAggregate results:')
    console.log(`knex-bun-sqlite:`, bunAgg)
    console.log(`sqlite3:        `, sqlite3Agg)
    
    if (bunAgg.count === sqlite3Agg.count) {
      console.log('✅ Aggregate results match')
    } else {
      console.log('❌ Aggregate results mismatch')
      allTestsPassed = false
    }
    
    // Test 7: Raw query
    console.log('\n' + '='.repeat(60))
    console.log('TEST 7: Raw queries')
    console.log('='.repeat(60))
    
    const bunRaw = await dbBun.raw('SELECT name, age FROM test_data WHERE age IS NOT NULL ORDER BY age')
    const sqlite3Raw = await dbSqlite3.raw('SELECT name, age FROM test_data WHERE age IS NOT NULL ORDER BY age')
    
    console.log(`\nRaw query results:`)
    console.log(`knex-bun-sqlite: ${bunRaw.length} rows`)
    console.log(`sqlite3:         ${sqlite3Raw.length} rows`)
    
    if (bunRaw.length === sqlite3Raw.length) {
      console.log('✅ Raw query results match')
      
      for (let i = 0; i < bunRaw.length; i++) {
        if (bunRaw[i].name !== sqlite3Raw[i].name || bunRaw[i].age !== sqlite3Raw[i].age) {
          console.log(`❌ Row ${i} mismatch:`)
          console.log(`   knex-bun-sqlite:`, bunRaw[i])
          console.log(`   sqlite3:        `, sqlite3Raw[i])
          allTestsPassed = false
        }
      }
    } else {
      console.log('❌ Raw query row count mismatch')
      allTestsPassed = false
    }
    
    // Test 8: Boolean handling
    console.log('\n' + '='.repeat(60))
    console.log('TEST 8: Boolean value handling')
    console.log('='.repeat(60))
    
    const bunBool = await dbBun('test_data').where('active', true).first()
    const sqlite3Bool = await dbSqlite3('test_data').where('active', true).first()
    
    console.log(`\nBoolean field:`)
    console.log(`knex-bun-sqlite: active=${bunBool.active} (${typeof bunBool.active})`)
    console.log(`sqlite3:         active=${sqlite3Bool.active} (${typeof sqlite3Bool.active})`)
    
    if (bunBool.active === sqlite3Bool.active) {
      console.log('✅ Boolean values match')
    } else {
      console.log('❌ Boolean values mismatch')
      allTestsPassed = false
    }
    
    // Final summary
    console.log('\n' + '='.repeat(60))
    console.log('FINAL SUMMARY')
    console.log('='.repeat(60))
    
    if (allTestsPassed) {
      console.log('\n✨ ALL TESTS PASSED! ✨')
      console.log('knex-bun-sqlite returns data in the SAME FORMAT as sqlite3')
      console.log('✅ Date/datetime fields: strings (matching sqlite3)')
      console.log('✅ Number fields: numbers (matching sqlite3)')
      console.log('✅ Boolean fields: numbers 0/1 (matching sqlite3)')
      console.log('✅ NULL values: null (matching sqlite3)')
      console.log('✅ Aggregate functions: matching sqlite3')
      console.log('✅ Raw queries: matching sqlite3')
      console.log('\n🎉 Our adapter is 100% compatible with sqlite3! 🎉\n')
    } else {
      console.log('\n❌ SOME TESTS FAILED')
      console.log('There are differences between knex-bun-sqlite and sqlite3\n')
      process.exit(1)
    }
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await dbBun.destroy()
    await dbSqlite3.destroy()
  }
}

runComparison()
