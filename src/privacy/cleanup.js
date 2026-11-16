/**
 * ClipVault - Cleanup
 * Automatic expiration and periodic history pruning logic.
 */

import * as Logger from '../utils/logger.js';

export class HistoryCleanup {
    /**
     * Purge unpinned items older than expirationDays.
     * @param {HistoryManager} historyManager
     * @param {number} expirationDays
     * @returns {number} count of purged items
     */
    static purgeExpired(historyManager, expirationDays) {
        if (!historyManager || !expirationDays || expirationDays <= 0) {
            return 0;
        }

        const nowSec = Math.floor(Date.now() / 1000);
        const cutoffSec = nowSec - (expirationDays * 86400);

        const items = historyManager.items;
        let purgedCount = 0;

        for (const item of items) {
            if (!item.pinned && item.timestamp && item.timestamp < cutoffSec) {
                historyManager.deleteItem(item.id);
                purgedCount++;
            }
        }

        if (purgedCount > 0) {
            Logger.info(`Cleaned up ${purgedCount} expired history items older than ${expirationDays} days`);
        }

        return purgedCount;
    }
}
