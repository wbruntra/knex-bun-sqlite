# knex-bun-sqlite Tests

This directory contains comprehensive tests for the `knex-bun-sqlite` adapter, specifically focusing on the date handling fix that resolves migration issues.

## Test Files

### 1. `test-dates.js`
Tests Date object handling in database operations.

**What it tests:**
- Inserting rows with Date objects
- Querying with Date parameters
- Updating with Date objects
- Raw queries with Date parameters
- Millisecond precision preservation
- Batch inserts with Date objects

**Run:**
```bash
bun run test:dates
```

### 2. `test-migrations.js`
Tests Knex migrations with the Date handling fix.

**What it tests:**
- Running migrations (which internally use Date timestamps)
- Verifying migration timestamps are stored correctly
- Migration rollback functionality
- Re-running migrations
- Full rollback of all migrations
- Migration status tracking

**Run:**
```bash
bun run test:migrations
```

### 3. `test-parameter-types.js`
Tests all parameter types to ensure proper normalization.

**What it tests:**
- String parameters
- Number parameters (int, float, bigint)
- Boolean parameters
- Date object parameters
- null and undefined parameters
- Buffer parameters (converted to Uint8Array)
- Mixed parameter types in single queries
- Array parameters (IN clauses)
- Edge case dates (very old/future dates)
- Date range queries (BETWEEN)

**Run:**
```bash
bun run test:types
```

## Running All Tests

To run all tests in sequence:

```bash
bun test
# or
bun run test
```

This will execute `run-tests.js` which runs all test suites and provides a summary.

## What the Tests Verify

These tests verify the fix for the bug where Knex migrations would fail with:
```
Binding expected string, TypedArray, boolean, number, bigint or null
```

The fix ensures that:
1. ✅ Date objects are automatically converted to SQLite datetime strings
2. ✅ Migration timestamps are properly stored
3. ✅ All Knex migration operations work correctly
4. ✅ Date queries and comparisons function properly
5. ✅ Other unsupported types (undefined, Buffer) are normalized
6. ✅ All standard parameter types continue to work

## Test Output

Each test provides detailed output showing:
- What is being tested
- The values being used
- Success/failure status
- Summary of results

Example successful output:
```
✅ Database connection established
✅ Table created successfully
✅ Inserted event with ID 1 using Date object: 2025-10-15T08:35:15.473Z
✅ Query with Date parameter returned 3 results
✨ All date handling tests passed! ✨
```

## Test Database

All tests use either:
- In-memory databases (`:memory:`) for speed
- Temporary files that are cleaned up after tests

No persistent database files are left behind after running tests.

## Requirements

- Bun runtime (>= 1.0.0)
- knex (>= 2.0.0) - installed as a dev dependency

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: bun test
```

The test runner exits with code 0 on success and code 1 on failure, making it suitable for automated testing.
