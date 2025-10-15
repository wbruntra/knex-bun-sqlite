// Quick test to see how sqlite3 handles Date objects
const knex = require('knex')

const db = knex({
  client: 'sqlite3',
  connection: { filename: ':memory:' },
  useNullAsDefault: true
})

async function test() {
  await db.schema.createTable('test', (table) => {
    table.increments('id')
    table.datetime('dt')
  })
  
  const testDate = new Date('2025-06-15T10:30:45.678Z')
  console.log('Inserting Date:', testDate)
  console.log('Type:', typeof testDate)
  console.log('valueOf():', testDate.valueOf())
  
  await db('test').insert({ dt: testDate })
  
  const result = await db('test').first()
  console.log('\nRetrieved:', result.dt)
  console.log('Type:', typeof result.dt)
  
  // Check what's actually stored in SQLite
  const raw = await db.raw('SELECT typeof(dt) as type, dt FROM test')
  console.log('\nSQLite storage:', raw[0])
  
  await db.destroy()
}

test()
