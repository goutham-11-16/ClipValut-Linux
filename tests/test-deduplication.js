/**
 * Test Suite: Deduplication
 */

import { Deduplication } from '../src/history/deduplication.js';
import { ContentType } from '../src/utils/constants.js';

export function runTests(assert) {
    print('Testing Deduplication...');

    const existingItems = [
        { id: '1', type: ContentType.TEXT, content: 'First copied text', timestamp: 100, pinned: false },
        { id: '2', type: ContentType.TEXT, content: 'Pinned text', timestamp: 200, pinned: true },
        { id: '3', type: ContentType.URL, content: 'https://example.com', timestamp: 300, pinned: false },
    ];

    // 1. Duplicate detection
    const duplicateItem = { id: '4', type: ContentType.TEXT, content: 'First copied text', timestamp: 500 };
    const res1 = Deduplication.processItem(existingItems, duplicateItem);

    assert(res1.isDuplicate === true, 'Correctly identifies duplicate item');
    assert(res1.updatedItems.length === 3, 'Does not increase items array length on duplicate');
    assert(res1.updatedItems[0].id === '1', 'Prepend existing duplicate to top');
    assert(res1.updatedItems[0].timestamp === 500, 'Updates timestamp on duplicate');

    // 2. Duplicate pinned item preservation
    const duplicatePinned = { id: '5', type: ContentType.TEXT, content: 'Pinned text', timestamp: 600 };
    const res2 = Deduplication.processItem(existingItems, duplicatePinned);

    assert(res2.isDuplicate === true, 'Identifies duplicate of pinned item');
    assert(res2.updatedItems[0].pinned === true, 'Preserves pinned state when updating duplicate');

    // 3. New item insertion
    const newItem = { id: '6', type: ContentType.TEXT, content: 'Brand new item', timestamp: 700 };
    const res3 = Deduplication.processItem(existingItems, newItem);

    assert(res3.isDuplicate === false, 'Identifies non-duplicate');
    assert(res3.updatedItems.length === 4, 'Increments length for new item');
    assert(res3.updatedItems[0].content === 'Brand new item', 'New item placed at top');
}
