/**
 * Test Suite: HistoryManager
 */

import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import { HistoryManager } from '../src/history/history-manager.js';
import { StorageManager } from '../src/history/storage-manager.js';
import { ContentType } from '../src/utils/constants.js';

export function runTests(assert) {
    print('Testing HistoryManager...');

    const testDir = GLib.build_filenamev([GLib.get_tmp_dir(), `clipvault-hm-test-${GLib.random_int()}`]);
    const storage = new StorageManager(testDir);
    const hm = new HistoryManager(storage, 3); // max size 3 for testing limit enforcement

    try {
        // 1. Adding items
        hm.addItem({ id: '1', type: ContentType.TEXT, content: 'Item 1', timestamp: 100 });
        hm.addItem({ id: '2', type: ContentType.TEXT, content: 'Item 2', timestamp: 200 });
        hm.addItem({ id: '3', type: ContentType.TEXT, content: 'Item 3', timestamp: 300 });

        assert(hm.count === 3, 'Contains 3 items');
        assert(hm.items[0].id === '3', 'Latest item is first');

        // 2. Limit enforcement (unpinned)
        hm.addItem({ id: '4', type: ContentType.TEXT, content: 'Item 4', timestamp: 400 });
        assert(hm.count === 3, 'Respects max size 3 by dropping oldest unpinned item (Item 1)');
        assert(hm.items.find(i => i.id === '1') === undefined, 'Item 1 was dropped');
        assert(hm.items[0].id === '4', 'Item 4 is at front');

        // 3. Pinning protects from limit drop
        hm.togglePin('2');
        assert(hm.items.find(i => i.id === '2').pinned === true, 'Item 2 is pinned');

        // Add 3 more items: 5, 6, 7.
        // Limit is 3 unpinned items + pinned item
        hm.addItem({ id: '5', type: ContentType.TEXT, content: 'Item 5', timestamp: 500 });
        hm.addItem({ id: '6', type: ContentType.TEXT, content: 'Item 6', timestamp: 600 });
        hm.addItem({ id: '7', type: ContentType.TEXT, content: 'Item 7', timestamp: 700 });

        const item2 = hm.items.find(i => i.id === '2');
        assert(item2 !== undefined && item2.pinned === true, 'Pinned item 2 survives multiple limit overflows');

        // 4. Delete item
        const deleted = hm.deleteItem('5');
        assert(deleted === true, 'Deleted item 5');
        assert(hm.items.find(i => i.id === '5') === undefined, 'Item 5 is gone');

        // 5. Clear unpinned
        hm.clearUnpinned();
        assert(hm.count === 1, 'Only pinned item remains after clearUnpinned');
        assert(hm.items[0].id === '2', 'Remaining item is pinned Item 2');

        // 6. Clear all
        hm.clearAll();
        assert(hm.count === 0, 'History is empty after clearAll');
    } finally {
        try {
            const dir = Gio.File.new_for_path(testDir);
            const enumerator = dir.enumerate_children('standard::name', Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);
            let fileInfo;
            while ((fileInfo = enumerator.next_file(null)) !== null) {
                const child = dir.get_child(fileInfo.get_name());
                if (child.query_file_type(Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null) === Gio.FileType.DIRECTORY) {
                    const subEnum = child.enumerate_children('standard::name', Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null);
                    let subInfo;
                    while ((subInfo = subEnum.next_file(null)) !== null) {
                        child.get_child(subInfo.get_name()).delete(null);
                    }
                }
                child.delete(null);
            }
            dir.delete(null);
        } catch (_) {}
    }
}
