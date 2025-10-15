// Type definitions for knex-bun-sqlite
// TypeScript users get full type safety

declare module 'knex-bun-sqlite' {
  /**
   * Result of a run() operation containing metadata about the execution
   */
  export interface RunResult {
    /** The row ID of the last inserted row */
    lastID?: number
    /** The number of rows affected by the query */
    changes: number
  }

  /**
   * Callback for run operations
   */
  export type RunCallback = (this: RunResult, err: Error | null) => void

  /**
   * Callback for get operations
   */
  export type GetCallback = (err: Error | null, row?: any) => void

  /**
   * Callback for all operations
   */
  export type AllCallback = (err: Error | null, rows: any[]) => void

  /**
   * Callback for each row in each operations
   */
  export type EachCallback = (err: Error | null, row: any) => void

  /**
   * Callback when each operation completes
   */
  export type CompleteCallback = (err: Error | null, count: number) => void

  /**
   * Generic error callback
   */
  export type ErrorCallback = (err: Error | null) => void

  /**
   * SQLite database open modes
   */
  export enum OpenMode {
    OPEN_READONLY = 0x00000001,
    OPEN_READWRITE = 0x00000002,
    OPEN_CREATE = 0x00000004
  }

  /**
   * Prepared statement for parameterized queries
   */
  export class Statement {
    /**
     * Bind parameters to the prepared statement
     * @param params Parameters to bind
     */
    bind(...params: any[]): this

    /**
     * Reset the statement
     * @param callback Optional callback
     */
    reset(callback?: ErrorCallback): this

    /**
     * Finalize and free the statement
     * @param callback Optional callback
     */
    finalize(callback?: ErrorCallback): this

    /**
     * Execute the statement (for INSERT, UPDATE, DELETE)
     * @param params Optional parameters
     * @param callback Optional callback
     */
    run(...params: any[]): this
    run(callback: RunCallback): this
    run(...params: any[]): this

    /**
     * Execute the statement and get the first result row
     * @param params Optional parameters
     * @param callback Optional callback
     */
    get(...params: any[]): any
    get(callback: GetCallback): any
    get(...params: any[]): any

    /**
     * Execute the statement and get all result rows
     * @param params Optional parameters
     * @param callback Optional callback
     */
    all(...params: any[]): any[]
    all(callback: AllCallback): any[]
    all(...params: any[]): any[]

    /**
     * Execute the statement and iterate over result rows
     * @param params Optional parameters
     * @param callback Callback for each row
     * @param complete Optional callback when complete
     */
    each(...params: any[]): this
    each(callback: EachCallback, complete?: CompleteCallback): this
    each(...params: any[]): this
  }

  /**
   * SQLite database connection
   * 
   * This adapter wraps Bun's native sqlite driver to provide
   * a node-sqlite3 compatible API for use with Knex.js
   * 
   * @example
   * ```typescript
   * const Database = require('knex-bun-sqlite')
   * const db = new Database('./mydb.sqlite')
   * 
   * db.all('SELECT * FROM users', (err, rows) => {
   *   console.log(rows)
   * })
   * ```
   */
  export class Database {
    /**
     * Open mode: read-only
     */
    static readonly OPEN_READONLY: number

    /**
     * Open mode: read and write
     */
    static readonly OPEN_READWRITE: number

    /**
     * Open mode: create if doesn't exist
     */
    static readonly OPEN_CREATE: number

    /**
     * Create a new database connection
     * @param filename Path to database file (or ':memory:' for in-memory)
     * @param mode Optional open mode flags
     * @param callback Optional callback called when opened
     */
    constructor(filename: string, callback?: ErrorCallback)
    constructor(filename: string, mode?: number, callback?: ErrorCallback)

    /**
     * Close the database connection
     * @param callback Optional callback
     */
    close(callback?: ErrorCallback): void

    /**
     * Serialize database operations (calls callback immediately in this implementation)
     * @param callback Function to run serialized
     */
    serialize(callback?: () => void): void

    /**
     * Parallelize database operations (calls callback immediately in this implementation)
     * @param callback Function to run parallelized
     */
    parallelize(callback?: () => void): void

    /**
     * Run a query (for INSERT, UPDATE, DELETE)
     * @param sql SQL query string
     * @param params Optional parameters
     * @param callback Optional callback
     */
    run(sql: string, callback?: RunCallback): void
    run(sql: string, params: any | any[], callback?: RunCallback): void

    /**
     * Run a query and get the first result row
     * @param sql SQL query string
     * @param params Optional parameters
     * @param callback Optional callback
     */
    get(sql: string, callback?: GetCallback): any
    get(sql: string, params: any | any[], callback?: GetCallback): any

    /**
     * Run a query and get all result rows
     * @param sql SQL query string
     * @param params Optional parameters
     * @param callback Optional callback
     */
    all(sql: string, callback?: AllCallback): any[]
    all(sql: string, params: any | any[], callback?: AllCallback): any[]

    /**
     * Run a query and iterate over each result row
     * @param sql SQL query string
     * @param params Optional parameters
     * @param callback Callback for each row
     * @param complete Optional callback when complete
     */
    each(
      sql: string,
      callback: EachCallback,
      complete?: CompleteCallback
    ): void
    each(
      sql: string,
      params: any | any[],
      callback: EachCallback,
      complete?: CompleteCallback
    ): void

    /**
     * Execute one or multiple SQL statements (no results returned)
     * @param sql SQL statement(s)
     * @param callback Optional callback
     */
    exec(sql: string, callback?: ErrorCallback): void

    /**
     * Prepare a SQL statement for repeated execution
     * @param sql SQL query string
     * @param params Optional parameters
     * @param callback Optional callback
     */
    prepare(sql: string, callback?: ErrorCallback): Statement
    prepare(sql: string, params: any | any[], callback?: ErrorCallback): Statement
  }

  export default Database
}
