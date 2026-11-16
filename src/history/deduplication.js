/**
 * ClipVault - Deduplication
 * Handles duplicate entry detection, merging, and timestamp updating.
 */

export class Deduplication {
    /**
     * Find if an identical item already exists in the list.
     * @param {Array} items
     * @param {object} newItem
     * @returns {number} - index of existing item or -1
     */
    static findDuplicateIndex(items, newItem) {
        if (!items || !items.length || !newItem) return -1;

        for (let i = 0; i < items.length; i++) {
            const current = items[i];

            // Match based on content and type
            if (current.type === newItem.type) {
                if (current.type === 'image') {
                    // Match image if checksum or file path matches
                    if (newItem.checksum && current.checksum === newItem.checksum) {
                        return i;
                    }
                } else {
                    if (current.content === newItem.content) {
                        return i;
                    }
                }
            }
        }

        return -1;
    }

    /**
     * Process a new item against an existing items array:
     * - If duplicate: remove old, update timestamp, keep pinned state, prepend to top
     * - If new: prepend to top
     * @param {Array} items
     * @param {object} newItem
     * @returns {{ updatedItems: Array, isDuplicate: boolean, item: object }}
     */
    static processItem(items, newItem) {
        const copy = [...items];
        const dupIdx = this.findDuplicateIndex(copy, newItem);

        if (dupIdx !== -1) {
            const existing = copy[dupIdx];
            // Remove from old position
            copy.splice(dupIdx, 1);

            // Merge: preserve pinned state and ID, update timestamp and sourceApp
            const merged = {
                ...existing,
                timestamp: newItem.timestamp || Math.floor(Date.now() / 1000),
                sourceApp: newItem.sourceApp || existing.sourceApp,
            };

            // Insert at the front
            copy.unshift(merged);
            return { updatedItems: copy, isDuplicate: true, item: merged };
        } else {
            // New item, prepend
            copy.unshift(newItem);
            return { updatedItems: copy, isDuplicate: false, item: newItem };
        }
    }
}
