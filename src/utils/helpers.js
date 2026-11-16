/**
 * ClipVault - Helper Functions
 * General utilities for formatting, ID generation, and string manipulations.
 */

import GLib from 'gi://GLib';

/**
 * Generate a unique ID for clipboard items.
 * @returns {string}
 */
export function generateId() {
    return GLib.uuid_string_random();
}

/**
 * Format a Unix timestamp (seconds or milliseconds) into a user-friendly relative string.
 * @param {number} timestamp - timestamp in seconds or ms
 * @returns {string}
 */
export function formatRelativeTime(timestamp) {
    if (!timestamp) return '';
    // Normalize to seconds
    const timeSec = timestamp > 1000000000000 ? Math.floor(timestamp / 1000) : Math.floor(timestamp);
    const nowSec = Math.floor(Date.now() / 1000);
    const diff = Math.max(0, nowSec - timeSec);

    if (diff < 10) {
        return 'Just now';
    } else if (diff < 60) {
        return `${diff}s ago`;
    } else if (diff < 3600) {
        const mins = Math.floor(diff / 60);
        return `${mins}m ago`;
    } else if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        return `${hours}h ago`;
    } else if (diff < 172800) {
        return 'Yesterday';
    } else {
        const days = Math.floor(diff / 86400);
        if (days < 30) {
            return `${days}d ago`;
        }
        const date = new Date(timeSec * 1000);
        return date.toLocaleDateString();
    }
}

/**
 * Truncate preview text to a safe length and line count.
 * @param {string} text
 * @param {number} maxLines
 * @param {number} maxLength
 * @returns {string}
 */
export function createPreview(text, maxLines = 4, maxLength = 300) {
    if (!text) return '';
    const clean = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = clean.split('\n');
    let truncated = lines.slice(0, maxLines).join('\n');
    if (lines.length > maxLines || truncated.length > maxLength) {
        if (truncated.length > maxLength) {
            truncated = truncated.slice(0, maxLength);
        }
        truncated += ' …';
    }
    return truncated;
}
