/**
 * ClipVault - Storage Manager
 * Handles atomic file persistence for clipboard history JSON and image media.
 * Enforces secure local file permissions (0600 / 0700).
 */

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import { Defaults } from '../utils/constants.js';
import * as Logger from '../utils/logger.js';

export class StorageManager {
    constructor(baseDir = null) {
        if (!baseDir) {
            const dataDir = GLib.get_user_data_dir();
            this._baseDir = GLib.build_filenamev([dataDir, Defaults.STORAGE_DIR]);
        } else {
            this._baseDir = baseDir;
        }

        this._historyFilePath = GLib.build_filenamev([this._baseDir, Defaults.HISTORY_FILE]);
        this._mediaDirPath = GLib.build_filenamev([this._baseDir, Defaults.MEDIA_DIR]);

        this._ensureDirectories();
    }

    get baseDir() {
        return this._baseDir;
    }

    get historyFilePath() {
        return this._historyFilePath;
    }

    get mediaDirPath() {
        return this._mediaDirPath;
    }

    /**
     * Ensure the storage directories exist with secure permissions (0700).
     */
    _ensureDirectories() {
        try {
            GLib.mkdir_with_parents(this._baseDir, 0o700);
            GLib.mkdir_with_parents(this._mediaDirPath, 0o700);
        } catch (err) {
            Logger.error('Failed to create storage directories', err);
        }
    }

    /**
     * Load history items from disk.
     * @returns {{version: number, items: Array}}
     */
    load() {
        const file = Gio.File.new_for_path(this._historyFilePath);
        if (!file.query_exists(null)) {
            Logger.debug('History file does not exist yet. Returning empty history.');
            return { version: Defaults.SCHEMA_VERSION, items: [] };
        }

        try {
            const [ok, contents] = file.load_contents(null);
            if (!ok) {
                Logger.warn('Could not read history file contents');
                return { version: Defaults.SCHEMA_VERSION, items: [] };
            }

            const decoder = new TextDecoder('utf-8');
            const jsonText = decoder.decode(contents);
            const data = JSON.parse(jsonText);

            if (!data || !Array.isArray(data.items)) {
                Logger.warn('Invalid history file structure, resetting to empty.');
                return { version: Defaults.SCHEMA_VERSION, items: [] };
            }

            return {
                version: data.version || Defaults.SCHEMA_VERSION,
                items: data.items,
            };
        } catch (err) {
            Logger.error('Failed to parse history file, starting with empty history', err);
            return { version: Defaults.SCHEMA_VERSION, items: [] };
        }
    }

    /**
     * Save history items to disk atomically.
     * @param {Array} items
     * @param {number} version
     * @returns {boolean}
     */
    save(items, version = Defaults.SCHEMA_VERSION) {
        this._ensureDirectories();
        const payload = {
            version,
            items: items || [],
        };

        const jsonString = JSON.stringify(payload, null, 2);
        const encoder = new TextEncoder();
        const bytes = encoder.encode(jsonString);

        // Atomic write via temporary file
        const tmpPath = `${this._historyFilePath}.tmp.${GLib.random_int()}`;
        const tmpFile = Gio.File.new_for_path(tmpPath);

        try {
            const outStream = tmpFile.replace(null, false, Gio.FileCreateFlags.PRIVATE, null);
            outStream.write_all(bytes, null);
            outStream.close(null);

            // Set file mode to 0600 (owner read/write only)
            GLib.chmod(tmpPath, 0o600);

            // Atomic rename
            const destFile = Gio.File.new_for_path(this._historyFilePath);
            tmpFile.move(destFile, Gio.FileCopyFlags.OVERWRITE, null, null);

            Logger.debug(`Saved ${items.length} history items atomically.`);
            return true;
        } catch (err) {
            Logger.error('Failed to atomically write history file', err);
            try {
                if (tmpFile.query_exists(null)) {
                    tmpFile.delete(null);
                }
            } catch (_) {}
            return false;
        }
    }

    /**
     * Save binary image data to the media directory.
     * @param {string} id - item ID
     * @param {Uint8Array|GLib.Bytes} data
     * @param {string} extension - e.g. 'png'
     * @returns {string|null} - relative or absolute filename
     */
    saveImage(id, data, extension = 'png') {
        this._ensureDirectories();
        const fileName = `${id}.${extension}`;
        const filePath = GLib.build_filenamev([this._mediaDirPath, fileName]);
        const file = Gio.File.new_for_path(filePath);

        try {
            const bytes = data instanceof Uint8Array ? data : data.get_data();
            const outStream = file.replace(null, false, Gio.FileCreateFlags.PRIVATE, null);
            outStream.write_all(bytes, null);
            outStream.close(null);
            GLib.chmod(filePath, 0o600);
            return filePath;
        } catch (err) {
            Logger.error('Failed to save image file', err);
            return null;
        }
    }

    /**
     * Delete an image file if it exists.
     * @param {string} filePath
     */
    deleteImage(filePath) {
        if (!filePath) return;
        try {
            const file = Gio.File.new_for_path(filePath);
            if (file.query_exists(null)) {
                file.delete(null);
            }
        } catch (err) {
            Logger.error('Failed to delete image file', err);
        }
    }
}
