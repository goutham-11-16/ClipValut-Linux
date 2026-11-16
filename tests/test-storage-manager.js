/**
 * Test Suite: StorageManager
 */

import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import { StorageManager } from '../src/history/storage-manager.js';

export function runTests(assert) {
    print('Testing StorageManager...');

    const testDir = GLib.build_filenamev([GLib.get_tmp_dir(), `clipvault-test-${GLib.random_int()}`]);
    const storage = new StorageManager(testDir);

    try {
        // 1. Initial load on empty dir returns empty array
        const initial = storage.load();
        assert(Array.isArray(initial.items) && initial.items.length === 0, 'Loads empty array when no file exists');

        // 2. Save items atomically
        const testItems = [
            { id: 'item-1', content: 'Test item 1', pinned: false, timestamp: 1000 },
            { id: 'item-2', content: 'Test item 2', pinned: true, timestamp: 2000 },
        ];
        const saveResult = storage.save(testItems, 1);
        assert(saveResult === true, 'Saves items successfully');

        // 3. Load back saved items
        const loaded = storage.load();
        assert(loaded.items.length === 2, 'Loads exact number of saved items');
        assert(loaded.items[0].content === 'Test item 1', 'Item 1 content matches');
        assert(loaded.items[1].pinned === true, 'Item 2 pinned matches');

        // 4. Save and delete image
        const dummyBytes = new TextEncoder().encode('fake-png-data');
        const imgPath = storage.saveImage('img-1', dummyBytes, 'png');
        assert(imgPath !== null, 'Saves image file to media directory');

        const imgFile = Gio.File.new_for_path(imgPath);
        assert(imgFile.query_exists(null), 'Saved image file exists on disk');

        storage.deleteImage(imgPath);
        assert(!imgFile.query_exists(null), 'Image file deleted properly');
    } finally {
        // Cleanup test directory
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
