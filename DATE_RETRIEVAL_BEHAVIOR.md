# Date Handling: Reading from Database

## Summary

**Our implementation matches sqlite3 behavior EXACTLY**. Dates are stored and retrieved as **Unix timestamps (numbers in milliseconds)**, which is the standard behavior of the `sqlite3` (node-sqlite3) driver.

## How SQLite Stores Dates

SQLite **does not have a native DATE/DATETIME type**. Dates are stored as:
1. **INTEGER** - Unix timestamps (milliseconds or seconds since epoch) ⬅️ **We use this**
2. **TEXT** - ISO8601 strings ("YYYY-MM-DD HH:MM:SS.SSS")
3. **REAL** - Julian day numbers

The `sqlite3` (node-sqlite3) driver stores dates as **INTEGER** (Unix timestamps in milliseconds), and we match this behavior exactly.

## Current Behavior ✅

### When Writing to DB:
```javascript
await knex('events').insert({
  created_at: new Date()  // Date object
})
// ✅ Our normalizeParams() converts to: 1760518694219 (Unix timestamp in ms)
```

### When Reading from DB:
```javascript
const event = await knex('events').first()
console.log(event.created_at)  // 1760518694219 (number)
console.log(typeof event.created_at)  // 'number'
// NOT a Date object, but a Unix timestamp
```

## Is This Correct? YES! ✅

This **exactly matches** the behavior of the standard `sqlite3` driver:

### sqlite3 (node-sqlite3)
```javascript
// Stores dates as Unix timestamps (integers)
// Returns numbers (milliseconds since epoch)
row.created_at // => 1760518694219 (number)
```

### better-sqlite3
```javascript
// Also converts Date to Unix timestamp when writing
_formatBindings(bindings) {
  if (binding instanceof Date) {
    return binding.valueOf()  // milliseconds since epoch
  }
}
// Returns numbers
row.created_at // => 1760518694219 (number)
```

## Verified Compatibility ✅

We've run comprehensive tests comparing our adapter against `sqlite3`:

```bash
bun tests/test-sqlite3-comparison.js
```

**Results:**
```
✨ ALL TESTS PASSED! ✨
knex-bun-sqlite returns data in the SAME FORMAT as sqlite3
✅ Date/datetime fields: numbers (matching sqlite3)
✅ Number fields: numbers (matching sqlite3)  
✅ Boolean fields: numbers 0/1 (matching sqlite3)
✅ NULL values: null (matching sqlite3)
✅ Aggregate functions: matching sqlite3
✅ Raw queries: matching sqlite3

🎉 Our adapter is 100% compatible with sqlite3! 🎉
```

## How Users Can Convert Back to Date Objects

Since dates come back as Unix timestamps (numbers), conversion is simple:

### Option 1: Manual conversion
```javascript
const event = await knex('events').first()
const date = new Date(event.created_at)  // Simple! Pass timestamp to Date constructor
```

### Option 2: Use Knex's `postProcessResponse` hook
```javascript
const knex = require('knex')({
  client: require('knex-bun-sqlite'),
  connection: { filename: './db.sqlite' },
  postProcessResponse: (result) => {
    // Auto-convert timestamp numbers to Date objects
    if (Array.isArray(result)) {
      return result.map(row => convertDates(row))
    } else if (result && typeof result === 'object') {
      return convertDates(result)
    }
    return result
  }
})

function convertDates(row) {
  const dateColumns = ['created_at', 'updated_at', 'event_date']
  const converted = { ...row }
  
  for (const col of dateColumns) {
    if (converted[col] && typeof converted[col] === 'number') {
      converted[col] = new Date(converted[col])
    }
  }
  
  return converted
}
```

### Option 3: Per-query conversion
```javascript
const events = await knex('events').select('*')
const converted = events.map(event => ({
  ...event,
  created_at: new Date(event.created_at),
  updated_at: new Date(event.updated_at)
}))
```

## What Other Databases Do

### PostgreSQL
- Has native DATE/TIMESTAMP types
- `node-postgres` returns Date objects automatically for timestamp columns

### MySQL
- Has native DATE/DATETIME types  
- `mysql2` returns Date objects automatically for datetime columns

### SQLite (all drivers)
- **No native date type**
- `sqlite3` stores as **integers** (Unix timestamps), returns **numbers**
- `better-sqlite3` stores as **integers**, returns **numbers**
- **We match this behavior exactly!**

## Why Unix Timestamps?

Advantages of storing dates as Unix timestamps (integers):
1. ✅ **Efficient storage** - integers are compact
2. ✅ **Fast comparisons** - numeric comparison is very fast
3. ✅ **No timezone issues** - timestamps are UTC by definition
4. ✅ **Easy date math** - just add/subtract milliseconds
5. ✅ **Millisecond precision** - preserved perfectly
6. ✅ **Standard behavior** - matches sqlite3 and better-sqlite3

## Summary

✅ **Behavior matches sqlite3 exactly**  
✅ **Dates stored as integers (Unix timestamps in milliseconds)**  
✅ **Dates returned as numbers (not Date objects)**  
✅ **Easy to convert back: `new Date(timestamp)`**  
✅ **Tested and verified compatible**  
📝 **This is the standard SQLite driver behavior**

The current behavior is:
- ✅ Correct for SQLite
- ✅ **Matches sqlite3 driver exactly**
- ✅ **Matches better-sqlite3 behavior**
- ✅ Compatible with Knex
- ✅ User-friendly (numbers are easily converted with `new Date()`)
- ✅ Efficient and fast
