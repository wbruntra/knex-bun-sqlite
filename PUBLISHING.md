# knex-bun-sqlite

A complete npm package ready to publish! This adapter lets you use Bun's blazing-fast native SQLite driver with Knex.js.

## Package Structure

```
knex-bun-sqlite/
├── index.js           # Main adapter implementation
├── index.d.ts         # TypeScript definitions
├── package.json       # Package metadata
├── README.md          # Full documentation
├── LICENSE            # MIT license
├── .npmignore         # Publish configuration
└── examples/          # Usage examples
    ├── basic-usage.js
    ├── db-module.js
    ├── transactions.js
    └── migrations.js
```

## Publishing to npm

### 1. Update package.json

Before publishing, update these fields in `package.json`:

```json
{
  "author": "Your Name <your.email@example.com>",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/knex-bun-sqlite.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/knex-bun-sqlite/issues"
  },
  "homepage": "https://github.com/yourusername/knex-bun-sqlite#readme"
}
```

### 2. Test the package locally

```bash
cd knex-bun-sqlite

# Test one of the examples
bun examples/basic-usage.js

# Pack the package to see what will be published
npm pack

# This creates a .tgz file you can inspect
```

### 3. Publish to npm

```bash
# Login to npm (if not already logged in)
npm login

# Publish the package
npm publish

# Or for first-time publish of a scoped package
npm publish --access public
```

### 4. Install in other projects

Once published, anyone can use it:

```bash
bun add knex-bun-sqlite knex
```

## Alternative: Scoped Package

If you want to publish under your username/org:

1. Update package.json name to `@yourusername/knex-bun-sqlite`
2. Publish with: `npm publish --access public`

## Version Updates

When making updates:

```bash
# Patch version (bug fixes): 1.0.0 -> 1.0.1
npm version patch

# Minor version (new features): 1.0.0 -> 1.1.0
npm version minor

# Major version (breaking changes): 1.0.0 -> 2.0.0
npm version major

# Then publish
npm publish
```

## What Gets Published

Based on `.npmignore`, these files will be included:
- ✅ index.js
- ✅ index.d.ts
- ✅ README.md
- ✅ LICENSE
- ✅ package.json
- ✅ examples/

These will be excluded:
- ❌ node_modules/
- ❌ .git/
- ❌ Test files
- ❌ SQLite database files

## Testing Before Publishing

Create a test project to verify:

```bash
# In another directory
mkdir test-knex-bun
cd test-knex-bun
bun init -y

# Install from local path
bun add ../path/to/knex-bun-sqlite

# Or test the packed version
bun add ../path/to/knex-bun-sqlite/knex-bun-sqlite-1.0.0.tgz

# Create a test file and run it
```

## Badge for README (Optional)

After publishing, you can add badges:

```markdown
[![npm version](https://badge.fury.io/js/knex-bun-sqlite.svg)](https://www.npmjs.com/package/knex-bun-sqlite)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

## Documentation

The README.md includes:
- Installation instructions
- Quick start guide
- API reference
- Usage examples
- Performance benchmarks
- Troubleshooting

## Support

Consider adding:
- GitHub repository with issues enabled
- CONTRIBUTING.md for contributors
- CHANGELOG.md for version history
- CI/CD for automated testing
