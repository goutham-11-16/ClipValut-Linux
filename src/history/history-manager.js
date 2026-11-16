/**
 * ClipVault - History Manager
 * Manages clipboard items, pinning, limits, deduplication, and persistence.
 */

import { StorageManager } from './storage-manager.js';
import { Deduplication } from './deduplication.js';
import { SearchEngine } from './search-engine.js';
import { Defaults } from '../utils/constants.js';
import * as Logger from '../utils/logger.js';

export class HistoryManager {
    constructor(storageManager = null, maxHistorySize = Defaults.MAX_HISTORY_SIZE) {
        this._storage = storageManager || new StorageManager();
        this._maxHistorySize = maxHistorySize;
        this._items = [];
        this._listeners = new Set();

        this.load();
    }

    get items() {
        return [...this._items];
    }

    get count() {
        return this._items.length;
    }

    get maxHistorySize() {
        return this._maxHistorySize;
    }

    set maxHistorySize(size) {
        this._maxHistorySize = Math.max(10, size || Defaults.MAX_HISTORY_SIZE);
        this._enforceLimit();
        this.save();
    }

    /**
     * Subscribe to history change events.
     * @param {Function} callback
     * @returns {Function} unsubscribe function
     */
    subscribe(callback) {
        this._listeners.add(callback);
        return () => this._listeners.delete(callback);
    }

    _notify() {
        for (const cb of this._listeners) {
            try {
                cb(this._items);
            } catch (err) {
                Logger.error('Error in history listener', err);
            }
        }
    }

    /**
     * Load history from storage.
     */
    load() {
        const data = this._storage.load();
        this._items = data.items || [];
        this._enforceLimit();
        this._notify();
    }

    /**
     * Save history to storage.
     */
    save() {
        this._storage.save(this._items);
    }

    /**
     * Add a new item to history.
     * Handles deduplication and limit enforcement.
     * @param {object} item
     * @returns {object} added or updated item
     */
    addItem(item) {
        if (!item || (!item.content && !item.filePath)) {
            return null;
        }

        const { updatedItems, isDuplicate, item: resultItem } = Deduplication.processItem(this._items, item);
        this._items = updatedItems;

        this._enforceLimit();
        this.save();
        this._notify();

        Logger.debug(`History item ${isDuplicate ? 'updated' : 'added'} (Total: ${this._items.length})`);
        return resultItem;
    }

    /**
     * Enforce maximum unpinned history size. Pinned items are never deleted.
     */
    _enforceLimit() {
        let unpinnedCount = 0;
        const keptItems = [];

        for (const item of this._items) {
            if (item.pinned) {
                keptItems.push(item);
            } else {
                if (unpinnedCount < this._maxHistorySize) {
                    keptItems.push(item);
                    unpinnedCount++;
                } else {
                    // Item exceeded limit, clean up any associated image
                    if (item.filePath) {
                        this._storage.deleteImage(item.filePath);
                    }
                }
            }
        }

        this._items = keptItems;
    }

    /**
     * Toggle pinned state of an item.
     * @param {string} id
     * @returns {boolean} new pinned state
     */
    togglePin(id) {
        const item = this._items.find(i => i.id === id);
        if (!item) return false;

        item.pinned = !item.pinned;
        this.save();
        this._notify();
        return item.pinned;
    }

    /**
     * Delete an item by ID.
     * @param {string} id
     * @returns {boolean} true if deleted
     */
    deleteItem(id) {
        const index = this._items.findIndex(i => i.id === id);
        if (index === -1) return false;

        const [removed] = this._items.splice(index, 1);
        if (removed && removed.filePath) {
            this._storage.deleteImage(removed.filePath);
        }

        this.save();
        this._notify();
        return true;
    }

    /**
     * Clear all unpinned items.
     */
    clearUnpinned() {
        const kept = [];
        for (const item of this._items) {
            if (item.pinned) {
                kept.push(item);
            } else if (item.filePath) {
                this._storage.deleteImage(item.filePath);
            }
        }

        this._items = kept;
        this.save();
        this._notify();
        Logger.info('Cleared unpinned history');
    }

    /**
     * Clear all items, including pinned.
     */
    clearAll() {
        for (const item of this._items) {
            if (item.filePath) {
                this._storage.deleteImage(item.filePath);
            }
        }

        this._items = [];
        this.save();
        this._notify();
        Logger.info('Cleared all clipboard history');
    }

    /**
     * Search items.
     * @param {string} query
     * @returns {{ pinned: Array, recent: Array }}
     */
    search(query) {
        const filtered = SearchEngine.search(this._items, query);
        return SearchEngine.partition(filtered);
    }

    /**
     * Get partition of current items into pinned and recent.
     * @returns {{ pinned: Array, recent: Array }}
     */
    getPartitioned() {
        return SearchEngine.partition(this._items);
    }
}
