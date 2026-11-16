/**
 * ClipVault - Clipboard Restorer
 * Restores a selected history item back into the system clipboard.
 */

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import { ContentType } from '../utils/constants.js';
import * as Logger from '../utils/logger.js';

export class ClipboardRestorer {
    constructor(clipboardProvider, clipboardMonitor) {
        this._provider = clipboardProvider;
        this._monitor = clipboardMonitor;
    }

    /**
     * Restore an item to system clipboard.
     * @param {object} item
     * @returns {Promise<boolean>}
     */
    async restore(item) {
        if (!item) return false;

        // Inform monitor to avoid capturing this write
        if (this._monitor) {
            this._monitor.setRestoring(true);
        }

        let success = false;

        try {
            if (item.type === ContentType.IMAGE && item.filePath) {
                // Restore image from file
                const file = Gio.File.new_for_path(item.filePath);
                if (file.query_exists(null)) {
                    const [ok, contents] = file.load_contents(null);
                    if (ok) {
                        const bytes = new GLib.Bytes(contents);
                        const mime = item.mimeType || 'image/png';
                        success = this._provider.setContent(mime, bytes);
                    }
                }
            } else {
                // Restore text-based content
                const text = item.content || '';
                success = this._provider.setText(text);
            }

            Logger.debug(`Restored clipboard item (${item.type})`);
        } catch (err) {
            Logger.error('Failed to restore clipboard item', err);
            success = false;
        } finally {
            // Clear restoring state after short delay
            GLib.timeout_add(GLib.PRIORITY_DEFAULT, 300, () => {
                if (this._monitor) {
                    this._monitor.setRestoring(false);
                }
                return GLib.SOURCE_REMOVE;
            });
        }

        return success;
    }
}
