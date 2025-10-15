// Example 3: Transactions
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

const knex = require('knex')({
  client: 'sqlite3',
  connection: { filename: ':memory:' },
  useNullAsDefault: true
})

async function main() {
  // Create tables
  await knex.schema.createTable('accounts', (table) => {
    table.increments('id').primary()
    table.string('name')
    table.integer('balance')
  })

  // Insert initial data
  await knex('accounts').insert([
    { name: 'Alice', balance: 1000 },
    { name: 'Bob', balance: 500 }
  ])

  console.log('Initial balances:')
  console.log(await knex('accounts').select('*'))

  // Perform a transaction - transfer $200 from Alice to Bob
  try {
    await knex.transaction(async (trx) => {
      // Deduct from Alice
      await trx('accounts')
        .where('name', 'Alice')
        .decrement('balance', 200)
      
      // Add to Bob
      await trx('accounts')
        .where('name', 'Bob')
        .increment('balance', 200)
      
      console.log('\n✓ Transaction completed successfully')
    })
  } catch (err) {
    console.error('Transaction failed:', err)
  }

  console.log('\nFinal balances:')
  console.log(await knex('accounts').select('*'))

  await knex.destroy()
}

main().catch(console.error)
