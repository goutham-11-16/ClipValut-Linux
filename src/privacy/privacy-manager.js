/**
 * ClipVault - Privacy Manager
 * Coordinates private mode state, app exclusions, and cleanup cycles.
 */

import GLib from 'gi://GLib';
import { ExclusionFilter } from './exclusions.js';
import { HistoryCleanup } from './cleanup.js';
import { SettingsKeys } from '../utils/constants.js';
import * as Logger from '../utils/logger.js';

export class PrivacyManager {
    constructor(settings, historyManager) {
        this._settings = settings;
        this._history = historyManager;
        this._filter = new ExclusionFilter();
        this._privateMode = false;
        this._expirationDays = 0;
        this._intervalTimerId = 0;

        this._loadSettings();
        this._connectSettings();
        this._runStartupCleanup();
    }

    get isPrivateMode() {
        return this._privateMode;
    }

    set isPrivateMode(enabled) {
        this._privateMode = !!enabled;
        if (this._settings) {
            this._settings.set_boolean(SettingsKeys.PRIVATE_MODE, this._privateMode);
        }
        Logger.info(`Private mode ${this._privateMode ? 'enabled' : 'disabled'}`);
    }

    get exclusionFilter() {
        return this._filter;
    }

    _loadSettings() {
        if (!this._settings) return;

        this._privateMode = this._settings.get_boolean(SettingsKeys.PRIVATE_MODE);
        this._expirationDays = this._settings.get_int(SettingsKeys.HISTORY_EXPIRATION_DAYS);

        const apps = this._settings.get_strv(SettingsKeys.EXCLUDED_APPS);
        this._filter.setExcludedApps(apps);

        this._setupIntervalTimer();
    }

    _connectSettings() {
        if (!this._settings) return;

        this._settingsChangedId = this._settings.connect('changed', (settings, key) => {
            if (key === SettingsKeys.PRIVATE_MODE) {
                this._privateMode = settings.get_boolean(SettingsKeys.PRIVATE_MODE);
            } else if (key === SettingsKeys.EXCLUDED_APPS) {
                this._filter.setExcludedApps(settings.get_strv(SettingsKeys.EXCLUDED_APPS));
            } else if (key === SettingsKeys.HISTORY_EXPIRATION_DAYS) {
                this._expirationDays = settings.get_int(SettingsKeys.HISTORY_EXPIRATION_DAYS);
                this._runStartupCleanup();
            } else if (key === SettingsKeys.CLEAR_ON_INTERVAL || key === SettingsKeys.CLEAR_INTERVAL_MINUTES) {
                this._setupIntervalTimer();
            }
        });
    }

    _runStartupCleanup() {
        if (this._expirationDays > 0 && this._history) {
            HistoryCleanup.purgeExpired(this._history, this._expirationDays);
        }
    }

    _setupIntervalTimer() {
        if (this._intervalTimerId > 0) {
            GLib.source_remove(this._intervalTimerId);
            this._intervalTimerId = 0;
        }

        if (!this._settings) return;

        const clearOnInterval = this._settings.get_boolean(SettingsKeys.CLEAR_ON_INTERVAL);
        const intervalMinutes = this._settings.get_int(SettingsKeys.CLEAR_INTERVAL_MINUTES);

        if (clearOnInterval && intervalMinutes > 0) {
            const intervalSec = intervalMinutes * 60;
            this._intervalTimerId = GLib.timeout_add_seconds(
                GLib.PRIORITY_LOW,
                intervalSec,
                () => {
                    if (this._history) {
                        this._history.clearUnpinned();
                    }
                    return GLib.SOURCE_CONTINUE;
                }
            );
        }
    }

    destroy() {
        if (this._intervalTimerId > 0) {
            GLib.source_remove(this._intervalTimerId);
            this._intervalTimerId = 0;
        }
        if (this._settings && this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = 0;
        }
    }
}
