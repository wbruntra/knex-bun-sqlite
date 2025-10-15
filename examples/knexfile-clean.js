// knexfile.js - Clean migration setup
// No module interception needed!

module.exports = {
  development: {
    client: require('knex-bun-sqlite'),  // Just pass the client directly!
    connection: {
      filename: './dev.sqlite3'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './migrations'
    },
    seeds: {
      directory: './seeds'
    }
  },

  production: {
    client: require('knex-bun-sqlite'),
    connection: {
      filename: process.env.DATABASE_PATH || './prod.sqlite3'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './migrations'
    }
  }
}

// Then run migrations with:
// bun knex migrate:latest
// bun knex migrate:rollback
// bun knex seed:run
