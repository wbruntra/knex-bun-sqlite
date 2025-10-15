// Clean usage - No module interception needed!
// Just specify the client directly in your Knex config

const knex = require('knex')({
  client: require('../index.js'),  // Use the custom client directly!
  connection: {
    filename: ':memory:'
  },
  useNullAsDefault: true
})

async function main() {
  // Create a table
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary()
    table.string('name')
    table.integer('age')
  })

  console.log('✓ Created users table')

  // Insert data
  await knex('users').insert([
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 }
  ])

  console.log('✓ Inserted users')

  // Query data
  const users = await knex('users').select('*')
  console.log('\nUsers:', users)

  // Clean up
  await knex.destroy()
  console.log('\n✓ Done!')
}

main().catch(console.error)
