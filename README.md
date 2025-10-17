# knex-bun-sqlite

Use [Bun's native high-performance SQLite driver](https://bun.sh/docs/api/sqlite) (`bun:sqlite`) with [Knex.js](https://knexjs.org/).

**⚡ 3-6x faster than node-sqlite3** while keeping all of Knex's elegant query builder API!

## Why?

- 🚀 **Much Faster**: Bun's native SQLite is 3-6x faster than `node-sqlite3`
- 🎯 **Drop-in Replacement**: Works with existing Knex code
- 🪶 **Zero Native Dependencies**: No need to compile native addons
- ✨ **Clean API**: Use Knex's query builder with Bun's speed

## Installation

```bash
bun add knex-bun-sqlite knex
```

> **Note**: This package requires Bun runtime (v1.0.0+). It uses `bun:sqlite` which is only available in Bun.

## Quick Start

### Method 1: Reusable Database Module (Recommended ⭐)

Create a reusable database module for your application - this is the best practice:

```javascript
// db.js
const knex = require('knex')({
  client: require('knex-bun-sqlite'),  // Clean and simple!
  connection: { filename: './mydb.sqlite' },
  useNullAsDefault: true
})

module.exports = knex
```

Then in your app:

```javascript
const db = require('./db')

// Use Knex normally
const movies = await db('movies').where('year', '>', 2000).select('*')
await db.destroy()
```

### Method 2: Module Interception (Alternative)

If you prefer, you can also use module interception to replace `sqlite3` automatically:

```javascript
const KnexBunSqlite = require('knex-bun-sqlite')

// Intercept sqlite3 module loading
const Module = require('module')
const originalRequire = Module.prototype.require

Module.prototype.require = function(id) {
  if (id === 'sqlite3') {
    return KnexBunSqlite.Database  // Use the adapter
  }
  return originalRequire.apply(this, arguments)
}

// Now use Knex normally - it will use bun:sqlite under the hood!
const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: './mydb.sqlite'
  },
  useNullAsDefault: true
})

// All your queries work exactly the same!
async function example() {
  const users = await knex('users').select('*')
  console.log(users)
  await knex.destroy()
}

example()
```

## Features

All Knex operations are fully supported:

- ✅ SELECT queries with WHERE, JOIN, ORDER BY, LIMIT, etc.
- ✅ INSERT, UPDATE, DELETE operations
- ✅ Transactions
- ✅ Query builder methods
- ✅ Raw queries
- ✅ Connection pooling
- ✅ Proper cleanup with `.destroy()`
- ✅ Schema migrations (via SQLite3 in knexfile for CLI, bun:sqlite in your app)

## Examples

### Basic Queries

```javascript
const db = require('./db') // Your setup from above

// SELECT
const users = await db('users')
  .where('age', '>', 18)
  .orderBy('name')
  .select('*')

// INSERT
await db('users').insert({
  name: 'Alice',
  email: 'alice@example.com'
})

// UPDATE
await db('users')
  .where('id', 1)
  .update({ email: 'newemail@example.com' })

// DELETE
await db('users').where('inactive', true).del()

// Always clean up!
await db.destroy()
```

### Migrations

For **Knex CLI migrations** (running `bun knex migrate:latest`), use SQLite3 in your knexfile since Knex itself will invoke the SQLite driver:

```javascript
// knexfile.js - For Knex CLI migrations
module.exports = {
  development: {
    client: 'sqlite3',  // Use standard sqlite3 for CLI
    connection: {
      filename: './dev.sqlite3'
    },
    useNullAsDefault: true
  }
}
```

Then run migrations with Knex:

```bash
knex migrate:latest
knex migrate:rollback
knex seed:run
```

For your **application code**, use the reusable database module with `knex-bun-sqlite` (as shown in Method 1) to get the performance benefits of `bun:sqlite` while using the same database:

```javascript
// db.js - Your application's database connection
const knex = require('knex')({
  client: require('knex-bun-sqlite'),  // Use bun:sqlite for speed!
  connection: { filename: './dev.sqlite3' },
  useNullAsDefault: true
})

module.exports = knex
```

This gives you the best of both worlds: organized migrations with Knex CLI, and blazing-fast queries in your app!

#### Important: Why Not Use `knex-bun-sqlite` in knexfile.js?

When you run `bun knex migrate:latest` or any Knex CLI command, Knex ignores Bun's runtime and invokes Node.js directly to load and execute the migration code. This means:

- ❌ `knex-bun-sqlite` won't work in your knexfile.js (requires `bun:sqlite`, which Node.js doesn't have)
- ❌ You'll get an error: "Cannot find module 'bun:sqlite'"
- ✅ Use standard `sqlite3` in knexfile.js for CLI commands
- ✅ Use `knex-bun-sqlite` in your application code (via `db.js`) for the speed benefits

This is why we recommend the two-pronged approach: SQLite3 for migrations, `knex-bun-sqlite` for queries!

### Transactions

```javascript
await db.transaction(async (trx) => {
  await trx('accounts')
    .where('id', 1)
    .decrement('balance', 100)
  
  await trx('accounts')
    .where('id', 2)
    .increment('balance', 100)
})
```

## Performance

Benchmark comparison (using [Northwind Traders dataset](https://github.com/jpwhite3/northwind-SQLite3)):

| Driver | Read Performance | vs node-sqlite3 |
|--------|------------------|-----------------|
| **bun:sqlite** | ⚡ **Fastest** | **3-6x faster** |
| better-sqlite3 | Fast | 2x faster |
| node-sqlite3 | Baseline | 1x |
| deno sqlite | Slow | 0.5x |

*Source: [Bun's official benchmarks](https://bun.sh/docs/api/sqlite#performance)*

## How It Works

This package creates an adapter that:

1. Wraps `bun:sqlite`'s synchronous API
2. Implements the callback-based API that Knex expects
3. Translates between the two APIs seamlessly
4. Preserves all Knex functionality

The adapter implements the complete `sqlite3` (node-sqlite3) API that Knex uses:
- `Database` class with `run()`, `get()`, `all()`, `prepare()`, etc.
- `Statement` class for prepared statements
- Proper callback context with `lastID` and `changes` properties
- Constants like `OPEN_READONLY`, `OPEN_READWRITE`, `OPEN_CREATE`

## API Reference

### Database Methods

The adapter provides a sqlite3-compatible Database class:

```typescript
class Database {
  constructor(filename: string, mode?: number, callback?: (err: Error | null) => void)
  
  run(sql: string, params?: any[], callback?: (this: RunResult, err: Error | null) => void): void
  get(sql: string, params?: any[], callback?: (err: Error | null, row?: any) => void): any
  all(sql: string, params?: any[], callback?: (err: Error | null, rows: any[]) => void): any[]
  each(sql: string, params?: any[], rowCallback?: (err: Error | null, row: any) => void, completeCallback?: (err: Error | null, count: number) => void): void
  exec(sql: string, callback?: (err: Error | null) => void): void
  prepare(sql: string, callback?: (err: Error | null) => void): Statement
  close(callback?: (err: Error | null) => void): void
  serialize(callback?: () => void): void
  parallelize(callback?: () => void): void
}

interface RunResult {
  lastID: number
  changes: number
}
```

## Requirements

- **Bun v1.0.0 or higher** - This package uses `bun:sqlite` which is built into Bun
- **Knex v2.0.0 or higher** - For the query builder

## Limitations

- ⚠️ **Bun only** - This package will not work with Node.js (it requires Bun's native SQLite)
- ⚠️ **Experimental** - While extensively tested, there may be edge cases not covered

## Troubleshooting

### "Cannot find module 'bun:sqlite'"

This means you're not running in Bun. Make sure to use:
```bash
bun run your-script.js
```
Not `node your-script.js`.

### Script doesn't exit

Make sure to call `await db.destroy()` when you're done:
```javascript
async function main() {
  // ... your queries
  await db.destroy() // Important!
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Credits

- Inspired by [better-sqlite3](https://github.com/JoshuaWise/better-sqlite3)
- Built for [Bun](https://bun.sh/)
- Works with [Knex.js](https://knexjs.org/)

## See Also

- [Bun SQLite Documentation](https://bun.sh/docs/api/sqlite)
- [Knex.js Documentation](https://knexjs.org/)
- [node-sqlite3](https://github.com/TryGhost/node-sqlite3)
