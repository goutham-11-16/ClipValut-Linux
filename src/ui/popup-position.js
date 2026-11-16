/**
 * ClipVault - Popup Positioning
 * Calculates optimal popup coordinates relative to the mouse pointer,
 * respecting screen edges, work areas, and multi-monitor layouts.
 */

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export class PopupPositioner {
    /**
     * Compute top-left (x, y) coordinates for the popup.
     * @param {number} popupWidth
     * @param {number} popupHeight
     * @param {number} margin - offset from pointer
     * @returns {{ x: number, y: number }}
     */
    static calculatePosition(popupWidth, popupHeight, margin = 12) {
        // 1. Get current pointer coordinates
        const [pointerX, pointerY] = global.get_pointer();

        // 2. Determine current monitor
        const monitorIndex = global.display.get_current_monitor();
        const workArea = Main.layoutManager.getWorkAreaForMonitor(monitorIndex);

        if (!workArea) {
            // Fallback to center screen if workArea is somehow unavailable
            return {
                x: Math.max(10, pointerX),
                y: Math.max(10, pointerY),
            };
        }

        const workLeft = workArea.x;
        const workTop = workArea.y;
        const workRight = workArea.x + workArea.width;
        const workBottom = workArea.y + workArea.height;

        // Candidate position: bottom-right of pointer
        let x = pointerX + margin;
        let y = pointerY + margin;

        // Horizontal boundary check: flip to left if overflowing right edge
        if (x + popupWidth > workRight) {
            x = pointerX - popupWidth - margin;
            // If still overflowing left edge, clamp within work area
            if (x < workLeft) {
                x = workRight - popupWidth - margin;
            }
        }

        // Vertical boundary check: flip to above pointer if overflowing bottom edge
        if (y + popupHeight > workBottom) {
            y = pointerY - popupHeight - margin;
            // If overflowing top edge, clamp within work area
            if (y < workTop) {
                y = workBottom - popupHeight - margin;
            }
        }

        // Absolute clamping inside the work area boundaries
        x = Math.max(workLeft + 8, Math.min(x, workRight - popupWidth - 8));
        y = Math.max(workTop + 8, Math.min(y, workBottom - popupHeight - 8));

        return { x: Math.round(x), y: Math.round(y) };
    }
}
