// Test script for Knex migrations with knex-bun-sqlite
// This verifies that the date handling fix resolves the migration timestamp issue

const knex = require('knex')
const BunSqliteClient = require('../index.js')
const fs = require('fs')
const path = require('path')

console.log('🧪 Testing Knex Migrations with Date Handling\n')

const testDir = path.join(__dirname, 'temp-migrations')
const dbPath = path.join(__dirname, 'test-migrations.db')

// Clean up any existing test files
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true })
}
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath)
}

// Create migrations directory
fs.mkdirSync(testDir, { recursive: true })

// Configure Knex with migrations
const db = knex({
  client: BunSqliteClient,
  connection: {
    filename: dbPath
  },
  migrations: {
    directory: testDir,
    tableName: 'knex_migrations'
  },
  useNullAsDefault: true
})

// Create test migration files
const migration1 = `
exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('name');
    table.string('email');
    table.timestamps(true, true); // created_at, updated_at
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
`

const migration2 = `
exports.up = function(knex) {
  return knex.schema.createTable('posts', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('users.id');
    table.string('title');
    table.text('content');
    table.datetime('published_at');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('posts');
};
`

const migration3 = `
exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    table.datetime('last_login');
  });
};

exports.down = function(knex) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('last_login');
  });
};
`

async function runTests() {
  try {
    console.log('✅ Database connection established')

    // Create migration files
    console.log('\n📝 Creating test migration files...')
    const timestamp1 = '20250101000000'
    const timestamp2 = '20250101000001'
    const timestamp3 = '20250101000002'
    
    fs.writeFileSync(path.join(testDir, `${timestamp1}_create_users_table.js`), migration1)
    fs.writeFileSync(path.join(testDir, `${timestamp2}_create_posts_table.js`), migration2)
    fs.writeFileSync(path.join(testDir, `${timestamp3}_add_last_login_to_users.js`), migration3)
    console.log('✅ Created 3 migration files')

    // Test 1: Run all migrations
    console.log('\n🔬 Test 1: Running all migrations')
    const [batchNo, migrations] = await db.migrate.latest()
    console.log(`✅ Ran batch ${batchNo} with ${migrations.length} migrations:`)
    migrations.forEach(migration => {
      console.log(`   - ${path.basename(migration)}`)
    })

    // Test 2: Check migration table contains Date timestamps
    console.log('\n🔬 Test 2: Verifying migration timestamps in database')
    const migrationRecords = await db('knex_migrations').select('*').orderBy('id')
    console.log(`✅ Found ${migrationRecords.length} migration records:`)
    migrationRecords.forEach(record => {
      console.log(`   - ID: ${record.id}, Name: ${record.name}`)
      console.log(`     Migration Time: ${record.migration_time}`)
      // Verify the migration_time is stored (this was failing before the fix)
      if (record.migration_time) {
        console.log(`     ✅ Migration timestamp stored successfully`)
      } else {
        throw new Error('Migration timestamp is null - date handling failed!')
      }
    })

    // Test 3: Check that tables were created
    console.log('\n🔬 Test 3: Verifying tables were created')
    const hasUsersTable = await db.schema.hasTable('users')
    const hasPostsTable = await db.schema.hasTable('posts')
    console.log(`✅ users table exists: ${hasUsersTable}`)
    console.log(`✅ posts table exists: ${hasPostsTable}`)

    // Test 4: Insert data with timestamps
    console.log('\n🔬 Test 4: Inserting data with Date objects')
    const now = new Date()
    const [userId] = await db('users').insert({
      name: 'John Doe',
      email: 'john@example.com',
      created_at: now,
      updated_at: now
    })
    console.log(`✅ Inserted user with ID ${userId} and timestamps`)

    const postDate = new Date('2025-03-15T14:00:00Z')
    const [postId] = await db('posts').insert({
      user_id: userId,
      title: 'Test Post',
      content: 'This is a test post',
      published_at: postDate,
      created_at: now,
      updated_at: now
    })
    console.log(`✅ Inserted post with ID ${postId} and datetime fields`)

    // Test 5: Check migration status
    console.log('\n🔬 Test 5: Checking migration status')
    const [completed, pending] = await db.migrate.list()
    console.log(`✅ Completed migrations: ${completed.length}`)
    console.log(`✅ Pending migrations: ${pending.length}`)

    // Test 6: Rollback last migration
    console.log('\n🔬 Test 6: Rolling back last migration')
    const [rollbackBatch, rollbackMigrations] = await db.migrate.rollback()
    console.log(`✅ Rolled back batch ${rollbackBatch}:`)
    rollbackMigrations.forEach(migration => {
      console.log(`   - ${path.basename(migration)}`)
    })

    // Test 7: Verify rollback worked
    console.log('\n🔬 Test 7: Verifying rollback')
    const hasLastLoginColumn = await db.schema.hasColumn('users', 'last_login')
    console.log(`✅ last_login column exists after rollback: ${hasLastLoginColumn}`)
    if (hasLastLoginColumn) {
      throw new Error('Rollback failed - column still exists')
    }

    // Test 8: Re-run migrations
    console.log('\n🔬 Test 8: Re-running migrations')
    const [reBatchNo, reMigrations] = await db.migrate.latest()
    if (reMigrations.length > 0) {
      console.log(`✅ Re-ran ${reMigrations.length} migrations`)
    } else {
      console.log('✅ All migrations already up to date')
    }

    // Test 9: Full rollback
    console.log('\n🔬 Test 9: Rolling back all migrations')
    await db.migrate.rollback(undefined, true) // Rollback all
    const hasUsersTableAfter = await db.schema.hasTable('users')
    const hasPostsTableAfter = await db.schema.hasTable('posts')
    console.log(`✅ users table exists after full rollback: ${hasUsersTableAfter}`)
    console.log(`✅ posts table exists after full rollback: ${hasPostsTableAfter}`)
    
    if (hasUsersTableAfter || hasPostsTableAfter) {
      throw new Error('Full rollback failed - tables still exist')
    }

    console.log('\n✨ All migration tests passed! ✨')
    console.log('✅ Date objects in migration timestamps are handled correctly\n')

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await db.destroy()
    
    // Clean up test files
    console.log('\n🧹 Cleaning up test files...')
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true })
    }
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath)
    }
    console.log('✅ Cleanup complete\n')
  }
}

runTests()
