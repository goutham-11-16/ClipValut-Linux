/**
 * Test Suite: MimeDetector
 */

import { MimeDetector } from '../src/core/mime-detector.js';
import { ContentType } from '../src/utils/constants.js';

export function runTests(assert) {
    print('Testing MimeDetector...');

    // 1. Sensitive MIME detection
    assert(MimeDetector.isSensitive(['x-kde-passwordManagerHint']), 'Detects KDE password manager hint');
    assert(MimeDetector.isSensitive(['application/x-gnome-secrets']), 'Detects GNOME secrets hint');
    assert(MimeDetector.isSensitive(['text/plain', 'application/x-password-manager-hint']), 'Detects mixed sensitive hint');
    assert(!MimeDetector.isSensitive(['text/plain', 'text/html']), 'Non-sensitive returns false');
    assert(!MimeDetector.isSensitive([]), 'Empty mimetypes returns false');

    // 2. Image MIME detection
    assert(MimeDetector.getImageMimeType(['image/png']) === 'image/png', 'Detects image/png');
    assert(MimeDetector.getImageMimeType(['text/plain', 'image/jpeg']) === 'image/jpeg', 'Detects image/jpeg from list');
    assert(MimeDetector.getImageMimeType(['text/plain']) === null, 'Returns null when no image mime');

    // 3. URL detection
    assert(MimeDetector.isUrl('https://example.com/test?query=1'), 'Detects https URL');
    assert(MimeDetector.isUrl('http://localhost:8080'), 'Detects http localhost URL');
    assert(MimeDetector.isUrl('www.github.com'), 'Detects www domain');
    assert(!MimeDetector.isUrl('Just a regular sentence with no link.'), 'Non-URL returns false');

    // 4. Email detection
    assert(MimeDetector.isEmail('developer@example.com'), 'Detects email');
    assert(MimeDetector.isEmail('user.name+tag@sub.domain.co.uk'), 'Detects complex email');
    assert(!MimeDetector.isEmail('not an email address'), 'Non-email returns false');

    // 5. Code snippet detection
    const jsCode = `function calculateTotal(items) {
    const sum = items.reduce((acc, x) => acc + x.price, 0);
    return sum;
}`;
    assert(MimeDetector.isCodeSnippet(jsCode), 'Detects JavaScript code snippet');

    const pythonCode = `def greet(name):
    if not name:
        return None
    print(f"Hello, {name}")`;
    assert(MimeDetector.isCodeSnippet(pythonCode), 'Detects Python code snippet');

    assert(!MimeDetector.isCodeSnippet('This is just normal paragraph text describing something.'), 'Normal text is not code');

    // 6. Classification
    assert(MimeDetector.classifyText('https://ubuntu.com') === ContentType.URL, 'Classifies URL');
    assert(MimeDetector.classifyText('admin@clipvault.local') === ContentType.EMAIL, 'Classifies email');
    assert(MimeDetector.classifyText(jsCode) === ContentType.CODE, 'Classifies code');
    assert(MimeDetector.classifyText('Hello world') === ContentType.TEXT, 'Classifies text');
}
