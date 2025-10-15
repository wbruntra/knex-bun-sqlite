import Knex from 'knex'

const knexConfig = {
  client: require('knex-bun-sqlite'),
  connection: {
    filename: './dev.sqlite3',
  },
  migrations: {
    directory: './migrations',
  },
  useNullAsDefault: true,
}

const knex = Knex(knexConfig)

const command = process.argv[2]
const name = process.argv[3]

async function run() {
  try {
    switch (command) {
      case 'make':
        if (!name) {
          console.error('Please provide a migration name')
          process.exit(1)
        }
        const migrationName = await knex.migrate.make(name)
        console.log(`Created migration: ${migrationName}`)
        break

      case 'latest':
        const [batch, migrations] = await knex.migrate.latest()
        console.log(`Batch ${batch} run: ${migrations.length} migrations`)
        migrations.forEach((m: string) => console.log(`  - ${m}`))
        break

      case 'rollback':
        const [rollbackBatch, rollbackMigrations] = await knex.migrate.rollback()
        console.log(`Batch ${rollbackBatch} rolled back: ${rollbackMigrations.length} migrations`)
        rollbackMigrations.forEach((m: string) => console.log(`  - ${m}`))
        break

      case 'status':
        const status = await knex.migrate.status()
        console.log('Migration Status:', status)
        break

      default:
        console.log('Usage: bun migrate.ts <command> [args]')
        console.log('Commands:')
        console.log('  make <name>     - Create a new migration')
        console.log('  latest          - Run all pending migrations')
        console.log('  rollback        - Rollback the last batch')
        console.log('  status          - Check migration status')
    }
  } catch (error) {
    console.error('Migration error:', error)
    process.exit(1)
  } finally {
    await knex.destroy()
  }
}

run()
