// Example 1: Basic usage with Knex
const KnexBunSqlite = require('../index.js')

// Set up module interception
const Module = require('module')
const originalRequire = Module.prototype.require

Module.prototype.require = function(id) {
  if (id === 'sqlite3') {
    return KnexBunSqlite
  }
  return originalRequire.apply(this, arguments)
}

// Create Knex instance
const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: ':memory:' // Use in-memory database for this example
  },
  useNullAsDefault: true
})

async function main() {
  // Create a table
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary()
    table.string('name')
    table.string('email')
    table.integer('age')
  })

  console.log('✓ Created users table')

  // Insert some data
  await knex('users').insert([
    { name: 'Alice', email: 'alice@example.com', age: 30 },
    { name: 'Bob', email: 'bob@example.com', age: 25 },
    { name: 'Charlie', email: 'charlie@example.com', age: 35 }
  ])

  console.log('✓ Inserted 3 users')

  // Query the data
  const users = await knex('users').select('*')
  console.log('\nAll users:', users)

  // Query with conditions
  const adults = await knex('users')
    .where('age', '>=', 30)
    .select('name', 'age')
  console.log('\nUsers 30+:', adults)

  // Update
  await knex('users')
    .where('name', 'Bob')
    .update({ age: 26 })
  console.log('\n✓ Updated Bob\'s age')

  // Count
  const count = await knex('users').count('* as total')
  console.log('\nTotal users:', count[0].total)

  // Clean up
  await knex.destroy()
  console.log('\n✓ Done!')
}

main().catch(console.error)
