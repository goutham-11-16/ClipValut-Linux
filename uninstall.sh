#!/usr/bin/env bash
# ClipVault - Uninstallation Script
# Disables and removes ClipVault GNOME Shell extension.

set -euo pipefail

EXTENSION_UUID="clipvault@goutham.github.com"
TARGET_DIR="${HOME}/.local/share/gnome-shell/extensions/${EXTENSION_UUID}"

echo "=========================================================="
echo "          ClipVault Extension Uninstaller"
echo "=========================================================="

if command -v gnome-extensions >/dev/null 2>&1; then
    echo "Disabling extension ${EXTENSION_UUID}..."
    gnome-extensions disable "${EXTENSION_UUID}" 2>/dev/null || true
fi

if [ -d "${TARGET_DIR}" ]; then
    echo "Removing extension directory: ${TARGET_DIR}..."
    rm -rf "${TARGET_DIR}"
fi

echo "Extension removed successfully."
echo "Note: Stored history in ~/.local/share/clipvault was preserved."
echo "To also remove saved history, delete ~/.local/share/clipvault manually."
echo "=========================================================="
