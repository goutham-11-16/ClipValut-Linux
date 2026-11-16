/**
 * ClipVault - Keybindings Manager
 * Registers and manages the global keyboard shortcut (default Super + Alt + V).
 */

import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { SettingsKeys } from '../utils/constants.js';
import * as Logger from '../utils/logger.js';

export class KeybindingManager {
    constructor(settings, onTrigger) {
        this._settings = settings;
        this._onTrigger = onTrigger;
        this._bindingName = 'toggle-clipvault';
        this._isBound = false;

        this.bind();
    }

    bind() {
        if (this._isBound || !this._settings) return;

        try {
            Main.wm.addKeybinding(
                SettingsKeys.SHORTCUT,
                this._settings,
                Meta.KeyBindingFlags.NONE,
                Shell.ActionMode.ALL,
                () => {
                    if (typeof this._onTrigger === 'function') {
                        this._onTrigger();
                    }
                }
            );

            this._isBound = true;
            Logger.debug('Global shortcut bound successfully.');
        } catch (err) {
            Logger.error('Failed to bind global shortcut', err);
        }
    }

    unbind() {
        if (!this._isBound) return;

        try {
            Main.wm.removeKeybinding(SettingsKeys.SHORTCUT);
            this._isBound = false;
            Logger.debug('Global shortcut unbound successfully.');
        } catch (err) {
            Logger.error('Failed to unbind global shortcut', err);
        }
    }

    destroy() {
        this.unbind();
    }
}
