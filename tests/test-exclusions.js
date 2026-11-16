/**
 * Test Suite: ExclusionFilter & HistoryCleanup
 */

import { ExclusionFilter } from '../src/privacy/exclusions.js';
import { HistoryCleanup } from '../src/privacy/cleanup.js';
import { ContentType } from '../src/utils/constants.js';

export function runTests(assert) {
    print('Testing ExclusionFilter and Cleanup...');

    // 1. ExclusionFilter
    const filter = new ExclusionFilter(['1Password', 'KeePassXC', 'bitwarden', 'secrets']);

    assert(filter.isExcluded('1password'), 'Excludes 1password by string (case-insensitive)');
    assert(filter.isExcluded('org.keepassxc.KeePassXC'), 'Excludes keepassxc substring');
    assert(filter.isExcluded('com.bitwarden.desktop'), 'Excludes bitwarden desktop');
    assert(!filter.isExcluded('gnome-terminal'), 'Allows gnome-terminal');
    assert(!filter.isExcluded('org.mozilla.firefox'), 'Allows firefox');

    // Mock Meta.Window object
    const mockWindow = {
        get_wm_class: () => 'KeePassXC',
        get_gtk_application_id: () => 'org.keepassxc.KeePassXC',
    };
    assert(filter.isExcluded(mockWindow), 'Excludes mock Meta.Window');

    const mockAllowedWindow = {
        get_wm_class: () => 'gnome-text-editor',
        get_gtk_application_id: () => 'org.gnome.TextEditor',
    };
    assert(!filter.isExcluded(mockAllowedWindow), 'Allows mock allowed Meta.Window');

    // 2. HistoryCleanup
    const now = Math.floor(Date.now() / 1000);
    const tenDaysAgo = now - (10 * 86400);
    const twoDaysAgo = now - (2 * 86400);

    const deletedIds = [];
    const mockHistoryManager = {
        items: [
            { id: 'old-1', content: 'Old item', timestamp: tenDaysAgo, pinned: false },
            { id: 'old-pinned', content: 'Old pinned item', timestamp: tenDaysAgo, pinned: true },
            { id: 'recent-1', content: 'Recent item', timestamp: twoDaysAgo, pinned: false },
        ],
        deleteItem: (id) => deletedIds.push(id),
    };

    // Purge items older than 7 days
    const purged = HistoryCleanup.purgeExpired(mockHistoryManager, 7);
    assert(purged === 1, 'Purges 1 expired unpinned item');
    assert(deletedIds.includes('old-1'), 'Deleted old-1');
    assert(!deletedIds.includes('old-pinned'), 'Never deletes pinned item even if expired');
    assert(!deletedIds.includes('recent-1'), 'Keeps recent-1');
}
