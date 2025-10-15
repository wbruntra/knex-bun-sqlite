// Example 2: Using as a reusable database module
// This is the recommended pattern for real applications

// db.js - Create this file in your project
const KnexBunSqlite = require('knex-bun-sqlite')

// Set up module interception (do this once)
const Module = require('module')
const originalRequire = Module.prototype.require

Module.prototype.require = function(id) {
  if (id === 'sqlite3') {
    return KnexBunSqlite
  }
  return originalRequire.apply(this, arguments)
}

// Create and export the Knex instance
const db = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: './example.sqlite'
  },
  useNullAsDefault: true
})

module.exports = db

// Now in your application files, just import db:
// const db = require('./db')
// 
// const users = await db('users').select('*')
// await db.destroy()
