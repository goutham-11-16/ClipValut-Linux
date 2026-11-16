/**
 * Test Suite: SearchEngine
 */

import { SearchEngine } from '../src/history/search-engine.js';
import { ContentType } from '../src/utils/constants.js';

export function runTests(assert) {
    print('Testing SearchEngine...');

    const sampleItems = [
        { id: '1', type: ContentType.TEXT, content: 'Ubuntu 26.04 Noble LTS release', preview: 'Ubuntu 26.04 Noble LTS release', pinned: false, sourceApp: 'Terminal' },
        { id: '2', type: ContentType.URL, content: 'https://github.com/gnome-shell', preview: 'https://github.com/gnome-shell', pinned: true, sourceApp: 'Firefox' },
        { id: '3', type: ContentType.CODE, content: 'const app = express();', preview: 'const app = express();', pinned: false, sourceApp: 'VSCode' },
        { id: '4', type: ContentType.EMAIL, content: 'contact@gnome.org', preview: 'contact@gnome.org', pinned: true, sourceApp: 'Thunderbird' },
    ];

    // 1. Empty or whitespace query returns all
    assert(SearchEngine.search(sampleItems, '').length === 4, 'Empty query returns all items');
    assert(SearchEngine.search(sampleItems, '   ').length === 4, 'Whitespace query returns all items');

    // 2. Case-insensitive substring search
    const r1 = SearchEngine.search(sampleItems, 'ubuntu');
    assert(r1.length === 1 && r1[0].id === '1', 'Matches lower-case search query');

    const r2 = SearchEngine.search(sampleItems, 'GITHUB');
    assert(r2.length === 1 && r2[0].id === '2', 'Matches upper-case search query');

    // 3. Multi-word search (AND condition)
    const r3 = SearchEngine.search(sampleItems, 'ubuntu noble');
    assert(r3.length === 1 && r3[0].id === '1', 'Matches multi-term AND query');

    const r4 = SearchEngine.search(sampleItems, 'ubuntu express');
    assert(r4.length === 0, 'Does not match terms spanning different items');

    // 4. Search by source app
    const r5 = SearchEngine.search(sampleItems, 'vscode');
    assert(r5.length === 1 && r5[0].id === '3', 'Matches by sourceApp');

    // 5. Partitioning
    const { pinned, recent } = SearchEngine.partition(sampleItems);
    assert(pinned.length === 2, 'Partitions 2 pinned items');
    assert(recent.length === 2, 'Partitions 2 recent items');
}
