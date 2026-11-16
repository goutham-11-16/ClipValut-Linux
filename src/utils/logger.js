/**
 * ClipVault - Logger
 * Safe logging utility that strictly avoids logging sensitive clipboard contents.
 */

let debugEnabled = false;

export function setDebugLogging(enabled) {
    debugEnabled = !!enabled;
}

export function isDebugLogging() {
    return debugEnabled;
}

export function log(message, ...args) {
    console.log(`[ClipVault] ${message}`, ...args);
}

export function info(message, ...args) {
    console.info(`[ClipVault:INFO] ${message}`, ...args);
}

export function debug(message, ...args) {
    if (debugEnabled) {
        console.debug(`[ClipVault:DEBUG] ${message}`, ...args);
    }
}

export function warn(message, ...args) {
    console.warn(`[ClipVault:WARN] ${message}`, ...args);
}

export function error(message, err) {
    if (err) {
        console.error(`[ClipVault:ERROR] ${message}:`, err);
    } else {
        console.error(`[ClipVault:ERROR] ${message}`);
    }
}
