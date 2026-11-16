#!/usr/bin/env bash
# ClipVault - Installation Script
# Installs and enables the ClipVault GNOME Shell extension on Ubuntu GNOME Wayland.

set -euo pipefail

EXTENSION_UUID="clipvault@goutham.github.com"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${HOME}/.local/share/gnome-shell/extensions/${EXTENSION_UUID}"

echo "=========================================================="
echo "          ClipVault Extension Installer"
echo "=========================================================="

# 1. Verify GNOME Shell environment
if ! command -v gnome-shell >/dev/null 2>&1; then
    echo "ERROR: gnome-shell is not installed or not in PATH."
    exit 1
fi

SHELL_VERSION=$(gnome-shell --version)
echo "Detected: ${SHELL_VERSION}"

# 2. Compile GSettings schema
echo "Compiling GSettings schema..."
if command -v glib-compile-schemas >/dev/null 2>&1; then
    glib-compile-schemas "${SCRIPT_DIR}/schemas"
else
    echo "ERROR: glib-compile-schemas not found. Please install libglib2.0-bin."
    exit 1
fi

# 3. Create destination directory and copy files
echo "Installing extension to ${TARGET_DIR}..."
mkdir -p "${TARGET_DIR}"

# Copy extension files cleanly
cp -r "${SCRIPT_DIR}/metadata.json" "${TARGET_DIR}/"
cp -r "${SCRIPT_DIR}/extension.js" "${TARGET_DIR}/"
cp -r "${SCRIPT_DIR}/prefs.js" "${TARGET_DIR}/"
cp -r "${SCRIPT_DIR}/stylesheet.css" "${TARGET_DIR}/"
cp -r "${SCRIPT_DIR}/schemas" "${TARGET_DIR}/"
cp -r "${SCRIPT_DIR}/src" "${TARGET_DIR}/"

# Re-compile schemas in target directory
glib-compile-schemas "${TARGET_DIR}/schemas"

# 4. Enable extension via gnome-extensions
echo "Enabling extension via gnome-extensions..."
if command -v gnome-extensions >/dev/null 2>&1; then
    gnome-extensions enable "${EXTENSION_UUID}" || true
    echo "ClipVault extension enabled!"
else
    echo "NOTE: gnome-extensions command not available; please enable manually in Extensions app."
fi

echo "=========================================================="
echo " ClipVault successfully installed!"
echo " Press Super + Alt + V to toggle the clipboard history popup."
echo " To customize settings, open Extensions app -> ClipVault Settings."
echo "=========================================================="
