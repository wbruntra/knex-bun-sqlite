#!/usr/bin/env bun
// Test runner for knex-bun-sqlite
// Runs all test scripts and reports results

const { spawn } = require('child_process')
const path = require('path')

const tests = [
  {
    name: 'Date Handling Tests',
    file: 'test-dates.js',
    description: 'Tests Date object conversion and storage'
  },
  {
    name: 'Migration Tests',
    file: 'test-migrations.js',
    description: 'Tests Knex migrations with Date timestamps'
  },
  {
    name: 'Parameter Type Tests',
    file: 'test-parameter-types.js',
    description: 'Tests all parameter types (Date, Buffer, undefined, etc.)'
  }
]

console.log('╔══════════════════════════════════════════════════════════╗')
console.log('║         knex-bun-sqlite Test Suite Runner               ║')
console.log('╚══════════════════════════════════════════════════════════╝\n')

async function runTest(test) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Running: ${test.name}`)
    console.log(`Description: ${test.description}`)
    console.log('='.repeat(60))
    
    const testPath = path.join(__dirname, test.file)
    const proc = spawn('bun', [testPath], {
      stdio: 'inherit',
      cwd: __dirname
    })
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ name: test.name, passed: true })
      } else {
        resolve({ name: test.name, passed: false, code })
      }
    })
    
    proc.on('error', (err) => {
      reject({ name: test.name, error: err })
    })
  })
}

async function runAllTests() {
  const results = []
  
  for (const test of tests) {
    try {
      const result = await runTest(test)
      results.push(result)
    } catch (error) {
      results.push({ name: test.name, passed: false, error: error.message })
    }
  }
  
  // Print summary
  console.log('\n\n╔══════════════════════════════════════════════════════════╗')
  console.log('║                    Test Summary                          ║')
  console.log('╚══════════════════════════════════════════════════════════╝\n')
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED'
    console.log(`${status} - ${result.name}`)
    if (!result.passed && result.code) {
      console.log(`         Exit code: ${result.code}`)
    }
    if (result.error) {
      console.log(`         Error: ${result.error}`)
    }
  })
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`)
  console.log('─'.repeat(60))
  
  if (failed > 0) {
    console.log('\n❌ Some tests failed\n')
    process.exit(1)
  } else {
    console.log('\n✨ All tests passed! ✨\n')
    process.exit(0)
  }
}

runAllTests().catch(err => {
  console.error('\n❌ Test runner error:', err)
  process.exit(1)
})
