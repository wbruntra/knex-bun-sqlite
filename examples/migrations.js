// Example 4: Migrations
// This shows how to use Knex migrations with knex-bun-sqlite

// knexfile.js
const KnexBunSqlite = require('knex-bun-sqlite')

// Set up module interception
const Module = require('module')
const originalRequire = Module.prototype.require

Module.prototype.require = function(id) {
  if (id === 'sqlite3') {
    return KnexBunSqlite
  }
  return originalRequire.apply(this, arguments)
}

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  }
}

// Then run migrations with:
// bun knex migrate:make create_users_table
// bun knex migrate:latest
// bun knex migrate:rollback
// bun knex seed:make initial_users
// bun knex seed:run
