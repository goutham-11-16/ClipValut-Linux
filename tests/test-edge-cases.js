/**
 * Test Suite: Edge Cases
 */

import { MimeDetector } from '../src/core/mime-detector.js';
import { SearchEngine } from '../src/history/search-engine.js';
import { createPreview, formatRelativeTime, generateId } from '../src/utils/helpers.js';
import { Deduplication } from '../src/history/deduplication.js';
import { ContentType } from '../src/utils/constants.js';

export function runTests(assert) {
    print('Testing Edge Cases...');

    // 1. Helpers with null/undefined/empty
    assert(createPreview(null) === '', 'createPreview handles null');
    assert(createPreview(undefined) === '', 'createPreview handles undefined');
    assert(createPreview('') === '', 'createPreview handles empty string');

    assert(formatRelativeTime(null) === '', 'formatRelativeTime handles null');
    assert(formatRelativeTime(0) === '', 'formatRelativeTime handles 0');
    assert(formatRelativeTime(Date.now()) === 'Just now', 'formatRelativeTime handles current timestamp in ms');

    assert(typeof generateId() === 'string' && generateId().length > 10, 'generateId produces valid UUID');

    // 2. MimeDetector with edge cases
    assert(MimeDetector.classifyText(null) === ContentType.TEXT, 'classifyText handles null');
    assert(MimeDetector.classifyText('') === ContentType.TEXT, 'classifyText handles empty string');
    assert(MimeDetector.isUrl(null) === false, 'isUrl handles null');
    assert(MimeDetector.isEmail(null) === false, 'isEmail handles null');
    assert(MimeDetector.isCodeSnippet(null) === false, 'isCodeSnippet handles null');

    // Super long text
    const hugeText = 'a'.repeat(50000);
    assert(createPreview(hugeText).length <= 305, 'createPreview caps huge strings');
    assert(MimeDetector.isUrl(hugeText) === false, 'isUrl gracefully handles huge strings without regex lockup');

    // 3. SearchEngine with regex-breaking characters
    const items = [
        { id: '1', content: 'Normal text', preview: 'Normal text' },
        { id: '2', content: 'Special [regex] (test) *+?^$ characters', preview: 'Special' },
    ];
    assert(SearchEngine.search(items, '[regex]').length === 1, 'Search works with square brackets');
    assert(SearchEngine.search(items, '*+?^$').length === 1, 'Search works with regex special characters');
    assert(SearchEngine.search(items, '   \t  \n  ').length === 2, 'Search works with tabs and newlines');

    // 4. Deduplication with empty lists and null items
    assert(Deduplication.findDuplicateIndex([], null) === -1, 'findDuplicateIndex handles empty/null');
    assert(Deduplication.processItem([], { id: 'x', content: 'test' }).updatedItems.length === 1, 'processItem handles empty list');
}
