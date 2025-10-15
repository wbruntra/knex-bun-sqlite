// db.js - Clean reusable database module
// No module interception needed!

const knex = require('knex')({
  client: require('knex-bun-sqlite'),  // Just pass the client directly!
  connection: {
    filename: './mydb.sqlite'
  },
  useNullAsDefault: true
})

module.exports = knex

// Now in your app files:
// const db = require('./db')
// const users = await db('users').select('*')
// await db.destroy()
