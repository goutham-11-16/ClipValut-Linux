/**
 * ClipVault - Search Engine
 * Fast local search over clipboard history items with case-insensitive matching.
 */

export class SearchEngine {
    /**
     * Search an array of items with a query string.
     * @param {Array} items
     * @param {string} query
     * @returns {Array} filtered items
     */
    static search(items, query) {
        if (!items || !items.length) return [];
        if (!query || typeof query !== 'string') return [...items];

        const trimmed = query.trim().toLowerCase();
        if (trimmed.length === 0) return [...items];

        const terms = trimmed.split(/\s+/).filter(t => t.length > 0);

        return items.filter(item => {
            // Text to match against
            const content = (item.content || '').toLowerCase();
            const preview = (item.preview || '').toLowerCase();
            const type = (item.type || '').toLowerCase();
            const sourceApp = (item.sourceApp || '').toLowerCase();

            // All terms must match at least one field
            return terms.every(term =>
                content.includes(term) ||
                preview.includes(term) ||
                type.includes(term) ||
                sourceApp.includes(term)
            );
        });
    }

    /**
     * Separate a list of items into pinned and unpinned lists.
     * @param {Array} items
     * @returns {{ pinned: Array, recent: Array }}
     */
    static partition(items) {
        const pinned = [];
        const recent = [];

        for (const item of items) {
            if (item.pinned) {
                pinned.push(item);
            } else {
                recent.push(item);
            }
        }

        return { pinned, recent };
    }
}
