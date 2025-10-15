// knex-bun-sqlite - Use Bun's native SQLite driver with Knex.js
// This creates a custom Knex client that uses bun:sqlite instead of sqlite3

const { Database: BunDatabase } = require('bun:sqlite')

// Import Knex's SQLite3 client to extend it
let Client_SQLite3
try {
  Client_SQLite3 = require('knex/lib/dialects/sqlite3/index.js')
} catch (e) {
  // Fallback for different knex versions or structures
  console.warn('Could not load Knex SQLite3 client, using standalone adapter')
}

// Helper function to normalize parameters for bun:sqlite
// Converts Date objects and other unsupported types to SQLite-compatible values
function normalizeParams(params) {
  if (!Array.isArray(params)) {
    params = params === undefined ? [] : [params]
  }
  
  return params.map(param => {
    if (param instanceof Date) {
      // Convert Date to SQLite datetime format: 'YYYY-MM-DD HH:MM:SS.SSS'
      return param.toISOString().replace('T', ' ').substring(0, 23)
    } else if (param === undefined) {
      // Convert undefined to null for SQLite
      return null
    } else if (Buffer.isBuffer(param)) {
      // Convert Buffer to Uint8Array which bun:sqlite accepts
      return new Uint8Array(param)
    }
    return param
  })
}

class Database {
  constructor(filename, mode, callback) {
    // Handle different constructor signatures
    if (typeof mode === 'function') {
      callback = mode
      mode = null
    }
    
    try {
      this.db = new BunDatabase(filename)
      this.filename = filename
      
      // Call callback asynchronously to match sqlite3 behavior
      if (callback) {
        process.nextTick(() => {
          callback.call(this, null)
        })
      }
    } catch (err) {
      if (callback) {
        process.nextTick(() => {
          callback.call(this, err)
        })
      } else {
        throw err
      }
    }
  }

  close(callback) {
    try {
      this.db.close()
      if (callback) callback(null)
    } catch (err) {
      if (callback) callback(err)
    }
  }

  serialize(callback) {
    // bun:sqlite is synchronous by default, so we just call the callback
    if (callback) callback()
  }

  parallelize(callback) {
    // bun:sqlite is synchronous by default
    if (callback) callback()
  }

  run(sql, params, callback) {
    try {
      // Handle different argument signatures
      if (typeof params === 'function') {
        callback = params
        params = []
      }
      
      const normalizedParams = normalizeParams(params)
      const stmt = this.db.prepare(sql)
      const result = stmt.run(...normalizedParams)
      stmt.finalize()
      
      if (callback) {
        // Knex expects 'this' to have lastID and changes properties
        const context = {
          lastID: result.lastInsertRowid ? Number(result.lastInsertRowid) : undefined,
          changes: result.changes || 0
        }
        callback.call(context, null)
      }
    } catch (err) {
      if (callback) {
        callback.call(this, err)
      } else {
        throw err
      }
    }
  }

  get(sql, params, callback) {
    try {
      if (typeof params === 'function') {
        callback = params
        params = []
      }
      
      const normalizedParams = normalizeParams(params)
      const stmt = this.db.prepare(sql)
      const result = stmt.get(...normalizedParams)
      stmt.finalize()
      
      if (callback) {
        callback.call(this, null, result)
      }
      return result
    } catch (err) {
      if (callback) {
        callback.call(this, err)
      } else {
        throw err
      }
    }
  }

  all(sql, params, callback) {
    try {
      if (typeof params === 'function') {
        callback = params
        params = []
      }
      
      const normalizedParams = normalizeParams(params)
      const stmt = this.db.prepare(sql)
      const results = stmt.all(...normalizedParams)
      stmt.finalize()
      
      if (callback) {
        callback.call(this, null, results)
      }
      return results
    } catch (err) {
      if (callback) {
        callback.call(this, err)
      } else {
        throw err
      }
    }
  }

  each(sql, params, rowCallback, completeCallback) {
    try {
      // Handle different argument signatures
      if (typeof params === 'function') {
        completeCallback = rowCallback
        rowCallback = params
        params = []
      }
      
      const normalizedParams = normalizeParams(params)
      const stmt = this.db.prepare(sql)
      const results = stmt.all(...normalizedParams)
      stmt.finalize()
      
      let count = 0
      for (const row of results) {
        if (rowCallback) {
          rowCallback.call(this, null, row)
        }
        count++
      }
      
      if (completeCallback) {
        completeCallback.call(this, null, count)
      }
    } catch (err) {
      if (rowCallback) {
        rowCallback.call(this, err)
      }
      if (completeCallback) {
        completeCallback.call(this, err)
      }
    }
  }

  exec(sql, callback) {
    try {
      this.db.run(sql)
      if (callback) {
        callback.call(this, null)
      }
    } catch (err) {
      if (callback) {
        callback.call(this, err)
      } else {
        throw err
      }
    }
  }

  prepare(sql, params, callback) {
    try {
      if (typeof params === 'function') {
        callback = params
        params = []
      }
      
      const bunStmt = this.db.prepare(sql)
      const stmt = new Statement(bunStmt, this)
      
      if (callback) {
        callback.call(stmt, null)
      }
      return stmt
    } catch (err) {
      if (callback) {
        callback.call(this, err)
      } else {
        throw err
      }
    }
  }
}

class Statement {
  constructor(bunStatement, db) {
    this.stmt = bunStatement
    this.db = db
  }

  bind(...params) {
    this.boundParams = params
    return this
  }

  reset(callback) {
    // bun:sqlite statements don't need explicit reset
    if (callback) callback.call(this, null)
    return this
  }

  finalize(callback) {
    try {
      this.stmt.finalize()
      if (callback) callback.call(this, null)
    } catch (err) {
      if (callback) callback.call(this, err)
    }
    return this
  }

  run(...args) {
    let params = args
    let callback
    
    if (typeof args[args.length - 1] === 'function') {
      callback = args.pop()
      params = args
    }
    
    if (this.boundParams && params.length === 0) {
      params = this.boundParams
    }
    
    try {
      const normalizedParams = normalizeParams(params)
      const result = this.stmt.run(...normalizedParams)
      if (callback) {
        const context = {
          lastID: result.lastInsertRowid ? Number(result.lastInsertRowid) : undefined,
          changes: result.changes || 0
        }
        callback.call(context, null)
      }
    } catch (err) {
      if (callback) {
        callback.call(this, err)
      } else {
        throw err
      }
    }
    return this
  }

  get(...args) {
    let params = args
    let callback
    
    if (typeof args[args.length - 1] === 'function') {
      callback = args.pop()
      params = args
    }
    
    if (this.boundParams && params.length === 0) {
      params = this.boundParams
    }
    
    try {
      const normalizedParams = normalizeParams(params)
      const result = this.stmt.get(...normalizedParams)
      if (callback) {
        callback.call(this, null, result)
      }
      return result
    } catch (err) {
      if (callback) {
        callback.call(this, err)
      } else {
        throw err
      }
    }
  }

  all(...args) {
    let params = args
    let callback
    
    if (typeof args[args.length - 1] === 'function') {
      callback = args.pop()
      params = args
    }
    
    if (this.boundParams && params.length === 0) {
      params = this.boundParams
    }
    
    try {
      const normalizedParams = normalizeParams(params)
      const results = this.stmt.all(...normalizedParams)
      if (callback) {
        callback.call(this, null, results)
      }
      return results
    } catch (err) {
      if (callback) {
        callback.call(this, err)
      } else {
        throw err
      }
    }
  }

  each(...args) {
    let params = []
    let rowCallback
    let completeCallback
    
    // Parse arguments
    for (let i = 0; i < args.length; i++) {
      if (typeof args[i] === 'function') {
        if (!rowCallback) {
          rowCallback = args[i]
        } else {
          completeCallback = args[i]
        }
      } else {
        params.push(args[i])
      }
    }
    
    if (this.boundParams && params.length === 0) {
      params = this.boundParams
    }
    
    try {
      const normalizedParams = normalizeParams(params)
      const results = this.stmt.all(...normalizedParams)
      let count = 0
      
      for (const row of results) {
        if (rowCallback) {
          rowCallback.call(this, null, row)
        }
        count++
      }
      
      if (completeCallback) {
        completeCallback.call(this, null, count)
      }
    } catch (err) {
      if (rowCallback) {
        rowCallback.call(this, err)
      }
      if (completeCallback) {
        completeCallback.call(this, err)
      }
    }
    return this
  }
}

// Export constants that sqlite3 has
Database.OPEN_READONLY = 0x00000001
Database.OPEN_READWRITE = 0x00000002
Database.OPEN_CREATE = 0x00000004

// Create a driver object that mimics sqlite3's structure
const driver = Database
driver.Database = Database

// If we successfully loaded the Knex SQLite3 client, create a custom client
if (Client_SQLite3) {
  class BunSqliteClient extends Client_SQLite3 {
    constructor(config) {
      super(config)
      this.dialect = 'sqlite3'
      this.driverName = 'bun:sqlite'
    }
    
    _driver() {
      // Return our bun:sqlite adapter with proper structure
      return driver
    }
  }
  
  // Export both the client class and the adapter
  module.exports = BunSqliteClient
  module.exports.BunSqliteClient = BunSqliteClient
  module.exports.Database = Database
} else {
  // Fallback: export just the adapter for manual module interception
  module.exports = Database
  module.exports.Database = Database
}
