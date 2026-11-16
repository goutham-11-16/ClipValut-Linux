/**
 * ClipVault - Clipboard Provider
 * Low-level interface interacting with St.Clipboard and Clutter/Mutter selections.
 */

import St from 'gi://St';
import GLib from 'gi://GLib';
import * as Logger from '../utils/logger.js';

export class ClipboardProvider {
    constructor(clipboard = null) {
        this._clipboard = clipboard || St.Clipboard.get_default();
    }

    get clipboard() {
        return this._clipboard;
    }

    /**
     * Get available MIME types for the clipboard.
     * @returns {string[]}
     */
    getMimeTypes() {
        try {
            return this._clipboard.get_mimetypes(St.ClipboardType.CLIPBOARD) || [];
        } catch (err) {
            Logger.debug('Failed to get clipboard MIME types', err);
            return [];
        }
    }

    /**
     * Asynchronously retrieve plain text from clipboard.
     * @returns {Promise<string|null>}
     */
    getTextAsync() {
        return new Promise(resolve => {
            try {
                this._clipboard.get_text(St.ClipboardType.CLIPBOARD, (_clip, text) => {
                    resolve(text || null);
                });
            } catch (err) {
                Logger.debug('Failed to read clipboard text', err);
                resolve(null);
            }
        });
    }

    /**
     * Asynchronously retrieve binary content by MIME type.
     * @param {string} mimeType
     * @returns {Promise<GLib.Bytes|null>}
     */
    getContentAsync(mimeType) {
        return new Promise(resolve => {
            try {
                this._clipboard.get_content(St.ClipboardType.CLIPBOARD, mimeType, (_clip, bytes) => {
                    resolve(bytes || null);
                });
            } catch (err) {
                Logger.debug(`Failed to read clipboard content for ${mimeType}`, err);
                resolve(null);
            }
        });
    }

    /**
     * Set clipboard plain text.
     * @param {string} text
     */
    setText(text) {
        try {
            this._clipboard.set_text(St.ClipboardType.CLIPBOARD, text || '');
            return true;
        } catch (err) {
            Logger.error('Failed to set clipboard text', err);
            return false;
        }
    }

    /**
     * Set clipboard content by MIME type and bytes.
     * @param {string} mimeType
     * @param {GLib.Bytes} bytes
     */
    setContent(mimeType, bytes) {
        try {
            this._clipboard.set_content(St.ClipboardType.CLIPBOARD, mimeType, bytes);
            return true;
        } catch (err) {
            Logger.error(`Failed to set clipboard content for ${mimeType}`, err);
            return false;
        }
    }

    /**
     * Clear system clipboard.
     */
    clear() {
        this.setText('');
    }
}
