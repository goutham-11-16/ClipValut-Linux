/**
 * ClipVault - Test Runner
 * Executes all unit test suites and reports summary.
 */

import { runTests as runMimeTests } from './test-mime-detector.js';
import { runTests as runDeduplicationTests } from './test-deduplication.js';
import { runTests as runSearchTests } from './test-search-engine.js';
import { runTests as runStorageTests } from './test-storage-manager.js';
import { runTests as runHistoryTests } from './test-history-manager.js';
import { runTests as runPrivacyTests } from './test-exclusions.js';
import { runTests as runEdgeCaseTests } from './test-edge-cases.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        passed++;
        print(`  ✓ ${message}`);
    } else {
        failed++;
        printerr(`  ✗ FAIL: ${message}`);
    }
}

print('========================================================');
print('            Running ClipVault Test Suites               ');
print('========================================================');

try {
    runMimeTests(assert);
    runDeduplicationTests(assert);
    runSearchTests(assert);
    runStorageTests(assert);
    runHistoryTests(assert);
    runPrivacyTests(assert);
    runEdgeCaseTests(assert);
} catch (err) {
    printerr(`\n[FATAL ERROR IN TEST SUITE]: ${err}\n${err.stack}`);
    failed++;
}

print('========================================================');
print(`RESULTS: Passed: ${passed} | Failed: ${failed}`);
print('========================================================');

if (failed > 0) {
    imports.system.exit(1);
} else {
    print('ALL UNIT TESTS PASSED!');
    imports.system.exit(0);
}
