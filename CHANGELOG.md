# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2025-10-15

### 🎉 Major Improvement: Clean API!

#### Added
- **Custom Knex Client**: Now extends Knex's SQLite3 client properly
- **Direct client usage**: Pass the package directly to Knex config
- **No module interception needed** (though still supported as alternative)
- New cleaner examples demonstrating the improved API

#### Changed
- **BREAKING**: Primary usage pattern is now direct client passing
- Module interception is now Method 2 (alternative approach)
- Updated README to show clean usage first
- Updated all examples with cleaner patterns

#### How to Upgrade from 1.0.0

**Before (1.0.0):**
```javascript
const KnexBunSqlite = require('knex-bun-sqlite')
// ... module interception code ...
const knex = require('knex')({ client: 'sqlite3', ... })
```

**After (2.0.0):**
```javascript
// Much cleaner!
const knex = require('knex')({
  client: require('knex-bun-sqlite'),
  connection: { filename: './mydb.sqlite' },
  useNullAsDefault: true
})
```

#### Benefits
- ✨ Cleaner, more intuitive API
- 📝 Less boilerplate code
- 🎯 Works exactly like other Knex dialects
- 🔧 Easier to maintain and understand
- ⚡ Same blazing-fast performance

---

## [1.0.0] - 2025-10-15

### Initial Release

#### Features
- Adapter for bun:sqlite to work with Knex.js
- Module interception technique for drop-in replacement
- Full Knex API support
- 3-6x faster than node-sqlite3
- TypeScript definitions included
- Comprehensive documentation and examples
