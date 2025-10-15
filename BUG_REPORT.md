# Bug Fix Summary: knex-bun-sqlite Date Object Handling

## Problem Identified

When using the `knex-bun-sqlite` driver with Knex migrations, the migration system would fail with the error:

```
Binding expected string, TypedArray, boolean, number, bigint or null
```

## Root Cause

**Knex internally passes JavaScript `Date` objects as parameters** when recording migration timestamps. However, **Bun's native SQLite driver (`bun:sqlite`) only accepts specific primitive types**:
- string
- TypedArray
- boolean
- number
- bigint
- null

It does **NOT** accept JavaScript `Date` objects.

### Evidence

When running migrations with debug logging, we discovered:

```javascript
params: [ 1, 2025-10-15T08:35:15.473Z, "20251015082125_create_movies_table.js" ]
//          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//          This is a Date object, not a string!
```

The middle parameter is a `Date` object (`typeof === 'object'`), which causes Bun's SQLite to throw an error.

## Solution

Modified the `knex-bun-sqlite` adapter to automatically convert `Date` objects to ISO-formatted strings before passing them to Bun's SQLite driver.

### Changes Made

In `/node_modules/knex-bun-sqlite/index.js`, updated all query methods (`run`, `get`, `all`, `each`) in both the `Database` class and `Statement` class to normalize parameters:

```javascript
// Convert Date objects to ISO strings for SQLite
const normalizedParams = Array.isArray(params) 
  ? params.map(p => p instanceof Date ? p.toISOString().replace('T', ' ').substring(0, 23) : p)
  : [params]
```

This converts Date objects like:
- `2025-10-15T08:35:15.473Z` (Date object)

Into SQLite-compatible strings:
- `'2025-10-15 08:35:15.473'` (string)

### Modified Methods

**Database class:**
- `run()`
- `get()`
- `all()`
- `each()`

**Statement class:**
- `run()`
- `get()`
- `all()`
- `each()`

## Verification

After applying the fix:

1. ✅ Migrations run successfully
2. ✅ Migration timestamps are correctly stored
3. ✅ Database operations work normally
4. ✅ Date values are properly formatted for SQLite

```bash
bun migrate.ts latest
# Batch 1 run: 1 migrations
#   - 20251015082125_create_movies_table.js
```

## Recommendation for knex-bun-sqlite Package

This fix should be contributed back to the `knex-bun-sqlite` package maintainers, as it affects all users trying to use Knex migrations with the Bun SQLite adapter.

### Additional Type Conversions to Consider

While fixing the Date issue, consider also handling:
- **Buffers** → Convert to `Uint8Array` or base64 string
- **BigInt** → Already supported by bun:sqlite
- **undefined** → Convert to `null`

## Files Modified

- `/node_modules/knex-bun-sqlite/index.js` (8 methods updated)

## Testing

You can test this works with:

```bash
# Create a migration
bun migrate.ts make create_movies_table

# Run migrations
bun migrate.ts latest

# Rollback
bun migrate.ts rollback

# Check status
bun migrate.ts status
```
