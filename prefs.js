/**
 * ClipVault - Preferences Window
 * Native Libadwaita / GTK4 settings window for ClipVault.
 */

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import { SettingsKeys, Defaults } from './src/utils/constants.js';

export default class ClipVaultPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        window.set_default_size(680, 560);

        // --- Page 1: General ---
        const generalPage = new Adw.PreferencesPage({
            title: 'General',
            icon_name: 'preferences-system-symbolic',
        });
        window.add(generalPage);

        // Group: History Settings
        const historyGroup = new Adw.PreferencesGroup({
            title: 'History Settings',
            description: 'Configure clipboard retention and limits',
        });
        generalPage.add(historyGroup);

        // Max history size
        const sizeRow = new Adw.SpinRow({
            title: 'Maximum History Size',
            subtitle: 'Number of unpinned clipboard items to store',
            adjustment: new Gtk.Adjustment({
                lower: 10,
                upper: 1000,
                step_increment: 5,
                page_increment: 20,
                value: settings.get_int(SettingsKeys.HISTORY_SIZE),
            }),
        });
        sizeRow.connect('notify::value', () => {
            settings.set_int(SettingsKeys.HISTORY_SIZE, sizeRow.get_value());
        });
        historyGroup.add(sizeRow);

        // Enable images
        const imagesRow = new Adw.SwitchRow({
            title: 'Enable Image Clipboard',
            subtitle: 'Capture and preview copied images in history',
            active: settings.get_boolean(SettingsKeys.ENABLE_IMAGES),
        });
        imagesRow.connect('notify::active', () => {
            settings.set_boolean(SettingsKeys.ENABLE_IMAGES, imagesRow.get_active());
        });
        historyGroup.add(imagesRow);

        // Group: Keyboard Shortcut
        const shortcutGroup = new Adw.PreferencesGroup({
            title: 'Shortcut',
            description: 'Global keybinding to toggle the floating popup',
        });
        generalPage.add(shortcutGroup);

        const shortcutRow = new Adw.ActionRow({
            title: 'Toggle Popup Shortcut',
            subtitle: 'Default: Super + Alt + V',
        });
        const shortcutLabel = new Gtk.Label({
            label: (settings.get_strv(SettingsKeys.SHORTCUT)[0] || '<Super><Alt>v'),
            css_classes: ['dim-label'],
        });
        shortcutRow.add_suffix(shortcutLabel);
        shortcutGroup.add(shortcutRow);

        // --- Page 2: Privacy ---
        const privacyPage = new Adw.PreferencesPage({
            title: 'Privacy',
            icon_name: 'security-high-symbolic',
        });
        window.add(privacyPage);

        // Group: Private Mode
        const privacyGroup = new Adw.PreferencesGroup({
            title: 'Privacy Protection',
            description: 'Control when clipboard content is captured',
        });
        privacyPage.add(privacyGroup);

        const privateRow = new Adw.SwitchRow({
            title: 'Private Mode',
            subtitle: 'Temporarily pause recording new clipboard items',
            active: settings.get_boolean(SettingsKeys.PRIVATE_MODE),
        });
        privateRow.connect('notify::active', () => {
            settings.set_boolean(SettingsKeys.PRIVATE_MODE, privateRow.get_active());
        });
        privacyGroup.add(privateRow);

        // Group: Automatic Expiration
        const expirationGroup = new Adw.PreferencesGroup({
            title: 'History Cleanup',
            description: 'Automatically purge older entries',
        });
        privacyPage.add(expirationGroup);

        const expirationRow = new Adw.SpinRow({
            title: 'Auto-Expire After (Days)',
            subtitle: '0 means keep indefinitely (unless limit is exceeded)',
            adjustment: new Gtk.Adjustment({
                lower: 0,
                upper: 365,
                step_increment: 1,
                page_increment: 7,
                value: settings.get_int(SettingsKeys.HISTORY_EXPIRATION_DAYS),
            }),
        });
        expirationRow.connect('notify::value', () => {
            settings.set_int(SettingsKeys.HISTORY_EXPIRATION_DAYS, expirationRow.get_value());
        });
        expirationGroup.add(expirationRow);

        // Excluded Applications
        const exclusionsGroup = new Adw.PreferencesGroup({
            title: 'Application Exclusions',
            description: 'Ignore copies from password managers and sensitive apps',
        });
        privacyPage.add(exclusionsGroup);

        const currentExclusions = settings.get_strv(SettingsKeys.EXCLUDED_APPS).join(', ');
        const exclusionsRow = new Adw.EntryRow({
            title: 'Excluded App Names / Window Classes',
            text: currentExclusions,
        });
        exclusionsRow.connect('notify::text', () => {
            const raw = exclusionsRow.get_text() || '';
            const list = raw.split(',').map(s => s.trim()).filter(s => s.length > 0);
            settings.set_strv(SettingsKeys.EXCLUDED_APPS, list);
        });
        exclusionsGroup.add(exclusionsRow);

        // --- Page 3: Appearance ---
        const appearancePage = new Adw.PreferencesPage({
            title: 'Appearance',
            icon_name: 'preferences-desktop-display-symbolic',
        });
        window.add(appearancePage);

        const dimensionsGroup = new Adw.PreferencesGroup({
            title: 'Popup Dimensions',
            description: 'Customize the floating panel size',
        });
        appearancePage.add(dimensionsGroup);

        // Width
        const widthRow = new Adw.SpinRow({
            title: 'Popup Width (pixels)',
            adjustment: new Gtk.Adjustment({
                lower: 300,
                upper: 600,
                step_increment: 10,
                page_increment: 50,
                value: settings.get_int(SettingsKeys.POPUP_WIDTH) || Defaults.POPUP_WIDTH,
            }),
        });
        widthRow.connect('notify::value', () => {
            settings.set_int(SettingsKeys.POPUP_WIDTH, widthRow.get_value());
        });
        dimensionsGroup.add(widthRow);

        // Max Height
        const heightRow = new Adw.SpinRow({
            title: 'Popup Max Height (pixels)',
            adjustment: new Gtk.Adjustment({
                lower: 380,
                upper: 800,
                step_increment: 20,
                page_increment: 50,
                value: settings.get_int(SettingsKeys.POPUP_MAX_HEIGHT) || Defaults.POPUP_MAX_HEIGHT,
            }),
        });
        heightRow.connect('notify::value', () => {
            settings.set_int(SettingsKeys.POPUP_MAX_HEIGHT, heightRow.get_value());
        });
        dimensionsGroup.add(heightRow);

        // Debug Logging
        const advancedGroup = new Adw.PreferencesGroup({
            title: 'Advanced',
            description: 'Developer and diagnostic options',
        });
        appearancePage.add(advancedGroup);

        const debugRow = new Adw.SwitchRow({
            title: 'Debug Logging',
            subtitle: 'Log diagnostic events to journalctl (never logs clipboard data)',
            active: settings.get_boolean(SettingsKeys.DEBUG_LOGGING),
        });
        debugRow.connect('notify::active', () => {
            settings.set_boolean(SettingsKeys.DEBUG_LOGGING, debugRow.get_active());
        });
        advancedGroup.add(debugRow);
    }
}
