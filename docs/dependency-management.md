# Dependency Management Guide

## 🚨 **NEVER USE `npm audit fix --force` AGAIN!**

This guide will help you manage dependencies safely and avoid the dependency hell we just went through.

## 🛡️ Safe Update Commands

### 1. **Security Updates (Recommended)**

```bash
npm run security:audit-fix
```

- Runs `npm audit fix` safely
- Creates backups before making changes
- Tests everything after updates
- Rolls back automatically if anything breaks

### 2. **Force Security Updates (Use with extreme caution)**

```bash
npm run security:audit-fix-force
```

- Runs `npm audit fix --force` but with safety nets
- Creates backups before making changes
- Tests everything after updates
- Rolls back automatically if anything breaks

### 3. **Regular Package Updates**

```bash
npm run deps:update
```

- Runs `npm update` safely
- Creates backups before making changes
- Tests everything after updates
- Rolls back automatically if anything breaks

## 📋 Manual Update Process (When Safe Scripts Don't Work)

If you need to update dependencies manually:

1. **Create a backup first:**

   ```bash
   cp package.json package.json.backup
   cp package-lock.json package-lock.json.backup
   ```

2. **Update one package at a time:**

   ```bash
   npm install package-name@latest
   npm run type-check
   npm test -- --run
   ```

3. **If something breaks, restore immediately:**
   ```bash
   cp package.json.backup package.json
   cp package-lock.json.backup package-lock.json
   npm install
   ```

## 🔍 Testing After Updates

Always run these commands after any dependency changes:

```bash
# Check TypeScript compilation
npm run type-check

# Run all tests
npm test -- --run

# Build the project
npm run build
```

## 🚫 What to Avoid

- ❌ `npm audit fix --force` (without backups)
- ❌ Updating multiple packages at once
- ❌ Ignoring test failures after updates
- ❌ Not checking TypeScript compilation after updates

## 🔧 Current Project Setup

- **Testing Framework:** Vitest (not Jest!)
- **Build Tool:** Next.js
- **TypeScript:** Strict mode enabled
- **Package Manager:** npm

## 📁 Backup Location

Safe update scripts create backups in: `.dependency-backups/`

Each backup is timestamped, so you can restore from any previous state if needed.

## 🆘 Emergency Recovery

If everything is broken and you need to start fresh:

1. Delete `node_modules` and `package-lock.json`
2. Restore `package.json` from backup
3. Run `npm install`
4. Run tests to verify everything works

Remember: **It's better to be behind on updates than to have a broken project!**
