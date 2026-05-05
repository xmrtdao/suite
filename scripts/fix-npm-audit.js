#!/usr/bin/env node
/**
 * XMRT Suite - NPM Security Audit Fix Script
 * 
 * Run this script locally to update critical vulnerable packages:
 *   node scripts/fix-npm-audit.js
 * 
 * Critical packages this script targets:
 * - axios: SSRF, prototype pollution, DoS (HIGH)
 * - @eslint/plugin-kit: ReDoS (moderate)
 * - ajv: ReDoS via $data option (moderate)
 * - @stablelib/ed25519: signature malleability (moderate, breaking change)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function run(cmd, options = {}) {
  console.log(`\n> ${cmd}`);
  try {
    const output = execSync(cmd, { cwd: ROOT, stdio: 'inherit', ...options });
    return output;
  } catch (e) {
    console.error(`Command failed: ${cmd}`);
    if (options.exitOnError !== false) process.exit(1);
    return null;
  }
}

console.log('========================================');
console.log('XMRT Suite - NPM Security Audit Fix');
console.log('========================================');

// 1. Backup lockfile
const lockfile = path.join(ROOT, 'package-lock.json');
if (fs.existsSync(lockfile)) {
  fs.copyFileSync(lockfile, `${lockfile}.backup`);
  console.log('\n[1/5] Backed up package-lock.json');
}

// 2. Ensure we're on npmjs registry
console.log('\n[2/5] Setting registry to npmjs.org');
run('npm config set registry https://registry.npmjs.org/');

// 3. Update critical packages
console.log('\n[3/5] Updating critical vulnerable packages...');
const updates = [
  'axios@latest',          // Fixes SSRF, prototype pollution, DoS
  '@eslint/plugin-kit@latest', // Fixes ReDoS
  'ajv@latest',            // Fixes ReDoS via $data
];

// Use --legacy-peer-deps to bypass peer dependency conflicts
// Use --no-audit to skip audit during install (we'll run it after)
for (const pkg of updates) {
  run(`npm install ${pkg} --legacy-peer-deps --no-audit`, { exitOnError: false });
}

// 4. Update @web3modal/wagmi (breaking change - requires manual review)
console.log('\n[4/5] NOTE: @stablelib/ed25519 and @web3modal/wagmi require breaking changes.');
console.log('    Run the following manually if you want to update the Web3Modal stack:');
console.log('    npm install @web3modal/wagmi@latest wagmi@latest viem@latest --legacy-peer-deps --no-audit');
console.log('    Then verify all wallet connection flows still work.');

// 5. Verify
console.log('\n[5/5] Running npm audit to verify...');
run('npm audit --audit-level=high', { exitOnError: false });

console.log('\n========================================');
console.log('Done! Review any remaining HIGH/CRITICAL advisories above.');
console.log('If the build breaks, restore from backup:');
console.log('  mv package-lock.json.backup package-lock.json && npm ci');
console.log('========================================');
