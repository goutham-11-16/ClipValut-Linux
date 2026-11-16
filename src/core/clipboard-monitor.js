/**
 * ClipVault - Clipboard Monitor
 * Event-driven clipboard change listener using Mutter Selection APIs.
 * Filters out sensitive data, excluded applications, and private mode operations.
 */

import Meta from 'gi://Meta';
import GLib from 'gi://GLib';
import { MimeDetector } from './mime-detector.js';
import { ContentType } from '../utils/constants.js';
import { generateId, createPreview } from '../utils/helpers.js';
import * as Logger from '../utils/logger.js';

export class ClipboardMonitor {
    constructor(selection, clipboardProvider, historyManager, privacyManager, options = {}) {
        this._selection = selection;
        this._provider = clipboardProvider;
        this._history = historyManager;
        this._privacy = privacyManager;
        this._enableImages = options.enableImages !== undefined ? options.enableImages : true;

        this._isRestoring = false;
        this._ownerChangedId = 0;
        this._debounceTimeoutId = 0;

        this.start();
    }

    setRestoring(val) {
        this._isRestoring = !!val;
    }

    setEnableImages(val) {
        this._enableImages = !!val;
    }

    start() {
        if (!this._selection || this._ownerChangedId > 0) return;

        this._ownerChangedId = this._selection.connect(
            'owner-changed',
            (selection, selectionType, selectionSource) => {
                this._onSelectionOwnerChanged(selection, selectionType, selectionSource);
            }
        );

        Logger.debug('Clipboard monitor started.');
    }

    stop() {
        if (this._ownerChangedId > 0 && this._selection) {
            this._selection.disconnect(this._ownerChangedId);
            this._ownerChangedId = 0;
        }

        if (this._debounceTimeoutId > 0) {
            GLib.source_remove(this._debounceTimeoutId);
            this._debounceTimeoutId = 0;
        }

        Logger.debug('Clipboard monitor stopped.');
    }

    destroy() {
        this.stop();
    }

    _onSelectionOwnerChanged(selection, selectionType, _source) {
        if (selectionType !== Meta.SelectionType.SELECTION_CLIPBOARD) {
            return;
        }

        // Ignore if ClipVault is actively restoring a selected item
        if (this._isRestoring) {
            Logger.debug('Ignoring clipboard change from internal restoration.');
            return;
        }

        // Ignore if Private Mode is enabled
        if (this._privacy && this._privacy.isPrivateMode) {
            Logger.debug('Ignoring clipboard change because Private Mode is enabled.');
            return;
        }

        // Check if focused application is in exclusion list
        let focusWindow = null;
        try {
            if (global.display && global.display.focus_window) {
                focusWindow = global.display.focus_window;
            }
        } catch (_) {}

        if (focusWindow && this._privacy && this._privacy.exclusionFilter.isExcluded(focusWindow)) {
            Logger.debug('Ignoring clipboard change from excluded application.');
            return;
        }

        // Debounce slightly to allow clipboard owner to settle
        if (this._debounceTimeoutId > 0) {
            GLib.source_remove(this._debounceTimeoutId);
            this._debounceTimeoutId = 0;
        }

        this._debounceTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 80, () => {
            this._debounceTimeoutId = 0;
            this._processClipboardChange(focusWindow);
            return GLib.SOURCE_REMOVE;
        });
    }

    async _processClipboardChange(focusWindow) {
        try {
            const mimetypes = this._provider.getMimeTypes();
            if (!mimetypes || mimetypes.length === 0) {
                return;
            }

            // Security check: Ignore secrets / password manager contents
            if (MimeDetector.isSensitive(mimetypes)) {
                Logger.info('Ignored sensitive clipboard content (secret MIME type detected).');
                return;
            }

            // Identify source app name
            let sourceApp = null;
            if (focusWindow) {
                try {
                    sourceApp = focusWindow.get_wm_class() || focusWindow.get_gtk_application_id() || null;
                } catch (_) {}
            }

            // 1. Check for image content if images enabled
            const imageMime = this._enableImages ? MimeDetector.getImageMimeType(mimetypes) : null;
            if (imageMime) {
                await this._handleImageContent(imageMime, sourceApp);
                return;
            }

            // 2. Check for text content
            const textMime = MimeDetector.getTextMimeType(mimetypes);
            if (textMime) {
                await this._handleTextContent(textMime, sourceApp);
                return;
            }
        } catch (err) {
            Logger.error('Failed to process clipboard change', err);
        }
    }

    async _handleTextContent(mimeType, sourceApp) {
        const text = await this._provider.getTextAsync();
        if (!text || text.trim().length === 0) {
            return;
        }

        const type = MimeDetector.classifyText(text);
        const preview = createPreview(text);

        const item = {
            id: generateId(),
            type,
            content: text,
            preview,
            timestamp: Math.floor(Date.now() / 1000),
            pinned: false,
            sourceApp,
            mimeType,
        };

        this._history.addItem(item);
    }

    async _handleImageContent(mimeType, sourceApp) {
        const bytes = await this._provider.getContentAsync(mimeType);
        if (!bytes || bytes.get_size() === 0) {
            return;
        }

        const id = generateId();
        const ext = mimeType.split('/')[1] || 'png';
        const filePath = this._history._storage.saveImage(id, bytes, ext);

        if (!filePath) {
            return;
        }

        const item = {
            id,
            type: ContentType.IMAGE,
            content: `[Image: ${ext.toUpperCase()}]`,
            preview: `[Image: ${ext.toUpperCase()}]`,
            filePath,
            timestamp: Math.floor(Date.now() / 1000),
            pinned: false,
            sourceApp,
            mimeType,
            checksum: `${bytes.get_size()}-${ext}`,
        };

        this._history.addItem(item);
    }
}
