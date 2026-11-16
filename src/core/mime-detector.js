/**
 * ClipVault - MIME & Content Type Detector
 * Identifies content type (text, url, code, email, image) based on MIME types and content inspection.
 */

import { ContentType, SensitiveMimeTypes, ImageMimeTypes, TextMimeTypes } from '../utils/constants.js';

export class MimeDetector {
    /**
     * Check if available MIME types contain sensitive secret indicators.
     * @param {string[]} mimeTypes
     * @returns {boolean}
     */
    static isSensitive(mimeTypes) {
        if (!mimeTypes || !Array.isArray(mimeTypes)) return false;
        return mimeTypes.some(mime => SensitiveMimeTypes.includes(mime));
    }

    /**
     * Check if available MIME types indicate an image.
     * @param {string[]} mimeTypes
     * @returns {string|null} - matched image MIME type or null
     */
    static getImageMimeType(mimeTypes) {
        if (!mimeTypes || !Array.isArray(mimeTypes)) return null;
        for (const mime of mimeTypes) {
            if (ImageMimeTypes.includes(mime)) {
                return mime;
            }
        }
        return null;
    }

    /**
     * Check if available MIME types indicate plain text.
     * @param {string[]} mimeTypes
     * @returns {string|null} - matched text MIME type or null
     */
    static getTextMimeType(mimeTypes) {
        if (!mimeTypes || !Array.isArray(mimeTypes)) return null;
        for (const mime of mimeTypes) {
            if (TextMimeTypes.includes(mime)) {
                return mime;
            }
        }
        return null;
    }

    /**
     * Classify text content into URL, Email, Code, or generic Text.
     * @param {string} content
     * @returns {string} - ContentType value
     */
    static classifyText(content) {
        if (!content || typeof content !== 'string') {
            return ContentType.TEXT;
        }

        const trimmed = content.trim();

        // Check for URL
        if (this.isUrl(trimmed)) {
            return ContentType.URL;
        }

        // Check for single email address
        if (this.isEmail(trimmed)) {
            return ContentType.EMAIL;
        }

        // Check for code snippet
        if (this.isCodeSnippet(content)) {
            return ContentType.CODE;
        }

        return ContentType.TEXT;
    }

    /**
     * Test if a string is a valid URL.
     * @param {string} str
     * @returns {boolean}
     */
    static isUrl(str) {
        if (!str || str.length > 2048) return false;
        // Simple and robust URL pattern (http, https, ftp, file)
        try {
            if (/^(https?|ftp|file):\/\/[^\s/$.?#].[^\s]*$/i.test(str)) {
                return true;
            }
            // Domain with www.
            if (/^www\.[a-z0-9-]+(\.[a-z0-9-]+)+([/?#][^\s]*)?$/i.test(str)) {
                return true;
            }
        } catch (_) {}
        return false;
    }

    /**
     * Test if a string is an email address.
     * @param {string} str
     * @returns {boolean}
     */
    static isEmail(str) {
        if (!str || str.length > 254) return false;
        return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(str);
    }

    /**
     * Test if text resembles programming code.
     * @param {string} str
     * @returns {boolean}
     */
    static isCodeSnippet(str) {
        if (!str || str.length < 15) return false;

        let codeScore = 0;

        // Multiline with indentation (tabs or 2+ spaces at start of lines)
        const lines = str.split('\n');
        let indentedLines = 0;
        for (const line of lines) {
            if (/^(\t|\s{2,})[^\s]/.test(line)) {
                indentedLines++;
            }
        }
        if (lines.length > 2 && indentedLines >= Math.floor(lines.length / 3)) {
            codeScore += 2;
        }

        // Common programming syntax patterns
        const patterns = [
            /(\bconst\b|\blet\b|\bvar\b|\bfunction\b|\bclass\b|\bimport\b|\bexport\b)\s+[a-zA-Z0-9_$]+/,
            /(\bdef\b|\bclass\b|\belif\b|\bimport\b|\bfrom\b\s+[a-zA-Z0-9_]+\s+\bimport\b)/,
            /(\bpublic\b|\bprivate\b|\bprotected\b|\bvoid\b|\bint\b|\bstring\b)\s+[a-zA-Z0-9_]+/,
            /(\bstruct\b|\bfn\b|\bimpl\b|\bpub\b|\bmut\b)\s+[a-zA-Z0-9_]+/,
            /[{}[\]();]{3,}/,
            /(=>|===|!==|==|!=|&&|\|\||->|::|\+=|-=|\*=)/,
            /(console\.log|printf|println!|System\.out\.print)/,
            /(<\/?[a-z][a-z0-9]*[^<>]*>)/i, // HTML / XML / JSX
            /(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN)\s+[a-zA-Z0-9_*]/i, // SQL
        ];

        for (const pat of patterns) {
            if (pat.test(str)) {
                codeScore++;
            }
        }

        return codeScore >= 2;
    }
}
