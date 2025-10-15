# ✨ MUCH CLEANER API - Version 2.0!

## What Changed?

You asked for a cleaner way to use the adapter, and you were absolutely right! The new version is **way better**.

## Before (v1.0) - Module Interception 😕

```javascript
const KnexBunSqlite = require('knex-bun-sqlite')

// Had to intercept module loading...
const Module = require('module')
const originalRequire = Module.prototype.require

Module.prototype.require = function(id) {
  if (id === 'sqlite3') {
    return KnexBunSqlite
  }
  return originalRequire.apply(this, arguments)
}

// Then use Knex
const knex = require('knex')({
  client: 'sqlite3',
  connection: { filename: './mydb.sqlite' },
  useNullAsDefault: true
})
```

## After (v2.0) - Direct Client Usage! ⭐

```javascript
// Much cleaner!
const knex = require('knex')({
  client: require('knex-bun-sqlite'),  // Just pass it directly!
  connection: { filename: './mydb.sqlite' },
  useNullAsDefault: true
})
```

## How It Works Now

Instead of creating an adapter that mimics `sqlite3`, the package now **extends Knex's SQLite3 client class** directly. This is the proper way to create custom Knex dialects!

### Technical Details

```javascript
// Inside the package
const Client_SQLite3 = require('knex/lib/dialects/sqlite3/index.js')

class BunSqliteClient extends Client_SQLite3 {
  _driver() {
    return bunSqliteAdapter  // Returns our bun:sqlite adapter
  }
}

module.exports = BunSqliteClient
```

When you pass this client to Knex, it:
1. Recognizes it as a proper Knex client
2. Uses all the SQLite3 query building logic
3. Calls our `_driver()` method to get the database driver
4. Uses our bun:sqlite adapter for actual database operations

## Both Methods Work

### ✅ Method 1: Direct Client (Recommended)

```javascript
const knex = require('knex')({
  client: require('knex-bun-sqlite'),
  connection: { filename: './mydb.sqlite' },
  useNullAsDefault: true
})
```

**Benefits:**
- Clean and simple
- No magic/hacks
- Works like any other Knex dialect
- Easy to understand

### ✅ Method 2: Module Interception (Still Available)

```javascript
const KnexBunSqlite = require('knex-bun-sqlite')
// ... module interception code ...
const knex = require('knex')({ client: 'sqlite3', ... })
```

**When to use:**
- You have existing code with `client: 'sqlite3'`
- You don't want to change knexfile.js
- You're migrating gradually

## Real-World Examples

### Simple Script

```javascript
const knex = require('knex')({
  client: require('knex-bun-sqlite'),
  connection: { filename: ':memory:' },
  useNullAsDefault: true
})

const users = await knex('users').select('*')
await knex.destroy()
```

### Reusable DB Module

```javascript
// db.js
module.exports = require('knex')({
  client: require('knex-bun-sqlite'),
  connection: { filename: './mydb.sqlite' },
  useNullAsDefault: true
})

// app.js
const db = require('./db')
const data = await db('table').select('*')
```

### With Migrations

```javascript
// knexfile.js
module.exports = {
  development: {
    client: require('knex-bun-sqlite'),
    connection: { filename: './dev.sqlite3' },
    useNullAsDefault: true
  }
}
```

## Testing Results ✅

All tested and working:
- ✅ Basic queries (SELECT, INSERT, UPDATE, DELETE)
- ✅ Complex queries with WHERE, JOIN, ORDER BY
- ✅ Transactions
- ✅ Aggregations (SUM, COUNT, etc.)
- ✅ Schema operations
- ✅ Migrations
- ✅ Connection pooling

## Package Status

**Version:** 2.0.0  
**Status:** Ready to publish! 🚀  
**Breaking Change:** Yes (but easy to upgrade)  
**Recommendation:** Use the new direct client method

## Files Updated

- ✅ `index.js` - Now exports a proper Knex client class
- ✅ `README.md` - Updated with clean usage first
- ✅ `package.json` - Version bumped to 2.0.0
- ✅ `CHANGELOG.md` - Documents the improvement
- ✅ New examples:
  - `examples/clean-usage.js`
  - `examples/db-clean.js`
  - `examples/knexfile-clean.js`

## Ready to Publish!

The package is now **much better** and ready to publish with:

```bash
cd knex-bun-sqlite
npm publish
```

Your suggestion to make it cleaner was spot-on! The new API is:
- More intuitive
- Less code
- Easier to maintain
- Follows Knex conventions better

Thank you for pushing for a cleaner solution! 🙏
