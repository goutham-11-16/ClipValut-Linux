/**
 * ClipVault - Constants
 * Defines constants, MIME types, content types, and settings keys.
 */

export const ContentType = {
    TEXT: 'text',
    URL: 'url',
    CODE: 'code',
    EMAIL: 'email',
    IMAGE: 'image',
};

export const SensitiveMimeTypes = [
    'x-kde-passwordManagerHint',
    'application/x-gnome-secrets',
    'application/x-password-manager-hint',
    'application/x-keepassxc-metadata',
    'text/x-keepassxc-metadata',
];

export const TextMimeTypes = [
    'text/plain;charset=utf-8',
    'text/plain',
    'UTF8_STRING',
    'STRING',
    'text/unicode',
];

export const ImageMimeTypes = [
    'image/png',
    'image/jpeg',
    'image/bmp',
    'image/webp',
];

export const SettingsKeys = {
    SHORTCUT: 'shortcut',
    HISTORY_SIZE: 'history-size',
    PRIVATE_MODE: 'private-mode',
    HISTORY_EXPIRATION_DAYS: 'history-expiration-days',
    EXCLUDED_APPS: 'excluded-apps',
    POPUP_WIDTH: 'popup-width',
    POPUP_MAX_HEIGHT: 'popup-max-height',
    ENABLE_IMAGES: 'enable-images',
    DEBUG_LOGGING: 'debug-logging',
    CLEAR_ON_INTERVAL: 'clear-on-interval',
    CLEAR_INTERVAL_MINUTES: 'clear-interval-minutes',
};

export const Defaults = {
    MAX_HISTORY_SIZE: 100,
    POPUP_WIDTH: 380,
    POPUP_MAX_HEIGHT: 520,
    STORAGE_DIR: 'clipvault',
    HISTORY_FILE: 'history.json',
    MEDIA_DIR: 'media',
    SCHEMA_VERSION: 1,
};
