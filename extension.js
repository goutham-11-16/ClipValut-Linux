/**
 * ClipVault - Windows 11-style native floating clipboard history manager for GNOME Shell on Wayland.
 * Main extension lifecycle entry point.
 */

import St from 'gi://St';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

import { StorageManager } from './src/history/storage-manager.js';
import { HistoryManager } from './src/history/history-manager.js';
import { PrivacyManager } from './src/privacy/privacy-manager.js';
import { ClipboardProvider } from './src/core/clipboard-provider.js';
import { ClipboardMonitor } from './src/core/clipboard-monitor.js';
import { ClipboardRestorer } from './src/core/clipboard-restorer.js';
import { KeybindingManager } from './src/shortcuts/keybindings.js';
import { ClipVaultPopup } from './src/ui/popup.js';
import { SettingsKeys, Defaults } from './src/utils/constants.js';
import * as Logger from './src/utils/logger.js';

export default class ClipVaultExtension extends Extension {
    enable() {
        Logger.log(`Enabling ${this.metadata.name} v${this.metadata.version}...`);

        this._settings = this.getSettings();
        Logger.setDebugLogging(this._settings.get_boolean(SettingsKeys.DEBUG_LOGGING));

        // 1. Initialize Storage & History
        this._storageManager = new StorageManager();
        const maxHistory = this._settings.get_int(SettingsKeys.HISTORY_SIZE) || Defaults.MAX_HISTORY_SIZE;
        this._historyManager = new HistoryManager(this._storageManager, maxHistory);

        // 2. Initialize Privacy Manager
        this._privacyManager = new PrivacyManager(this._settings, this._historyManager);

        // 3. Initialize Clipboard Provider & Monitor
        this._clipboardProvider = new ClipboardProvider(St.Clipboard.get_default());
        const enableImages = this._settings.get_boolean(SettingsKeys.ENABLE_IMAGES);
        const selection = global.display ? global.display.get_selection() : null;

        this._clipboardMonitor = new ClipboardMonitor(
            selection,
            this._clipboardProvider,
            this._historyManager,
            this._privacyManager,
            { enableImages }
        );

        // 4. Initialize Restorer
        this._clipboardRestorer = new ClipboardRestorer(
            this._clipboardProvider,
            this._clipboardMonitor
        );

        // 5. Active popup instance tracking
        this._popup = null;

        // 6. Initialize Global Shortcut
        this._keybindingManager = new KeybindingManager(
            this._settings,
            () => this.togglePopup()
        );

        // 7. Watch for settings updates
        this._settingsChangedId = this._settings.connect('changed', (_settings, key) => {
            if (key === SettingsKeys.DEBUG_LOGGING) {
                Logger.setDebugLogging(this._settings.get_boolean(SettingsKeys.DEBUG_LOGGING));
            } else if (key === SettingsKeys.HISTORY_SIZE) {
                this._historyManager.maxHistorySize = this._settings.get_int(SettingsKeys.HISTORY_SIZE);
            } else if (key === SettingsKeys.ENABLE_IMAGES) {
                this._clipboardMonitor.setEnableImages(this._settings.get_boolean(SettingsKeys.ENABLE_IMAGES));
            }
        });

        Logger.log(`${this.metadata.name} enabled successfully.`);
    }

    disable() {
        Logger.log(`Disabling ${this.metadata.name}...`);

        // Close and destroy any open popup
        if (this._popup) {
            this._popup.close();
            this._popup = null;
        }

        // Unbind shortcuts
        if (this._keybindingManager) {
            this._keybindingManager.destroy();
            this._keybindingManager = null;
        }

        // Stop clipboard monitoring
        if (this._clipboardMonitor) {
            this._clipboardMonitor.destroy();
            this._clipboardMonitor = null;
        }

        // Clean up privacy manager
        if (this._privacyManager) {
            this._privacyManager.destroy();
            this._privacyManager = null;
        }

        // Disconnect settings
        if (this._settings && this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = 0;
        }

        this._historyManager = null;
        this._storageManager = null;
        this._clipboardProvider = null;
        this._clipboardRestorer = null;
        this._settings = null;

        Logger.log(`${this.metadata.name} disabled cleanly.`);
    }

    togglePopup() {
        if (this._popup && this._popup.visible) {
            this._popup.close();
            return;
        }

        const width = this._settings ? this._settings.get_int(SettingsKeys.POPUP_WIDTH) : Defaults.POPUP_WIDTH;
        const maxHeight = this._settings ? this._settings.get_int(SettingsKeys.POPUP_MAX_HEIGHT) : Defaults.POPUP_MAX_HEIGHT;

        this._popup = new ClipVaultPopup(
            this,
            this._historyManager,
            this._clipboardRestorer,
            this._privacyManager,
            { width, maxHeight }
        );

        this._popup.connect('closed', () => {
            this._popup = null;
        });

        this._popup.open();
    }
}
