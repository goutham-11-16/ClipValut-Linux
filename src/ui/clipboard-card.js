/**
 * ClipVault - Clipboard Card Component
 * Represents a single clipboard item card with type badge, timestamp, preview, and actions.
 */

import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import { ContentType } from '../utils/constants.js';
import { formatRelativeTime } from '../utils/helpers.js';

export const ClipboardCard = GObject.registerClass({
    GTypeName: 'ClipVaultCard',
    Signals: {
        'selected': {},
        'pin-toggled': {},
        'deleted': {},
    },
}, class ClipboardCard extends St.Button {
    _init(item, options = {}) {
        super._init({
            style_class: 'clipvault-card',
            reactive: true,
            can_focus: true,
            track_hover: true,
            x_expand: true,
        });

        this._item = item;
        this._isSelected = false;

        this._buildUi();

        this.connect('clicked', () => {
            this.emit('selected');
        });
    }

    get item() {
        return this._item;
    }

    setSelected(selected) {
        this._isSelected = !!selected;
        if (this._isSelected) {
            this.add_style_pseudo_class('active');
            this.grab_key_focus();
        } else {
            this.remove_style_pseudo_class('active');
        }
    }

    _buildUi() {
        const layout = new St.BoxLayout({
            vertical: true,
            x_expand: true,
            style_class: 'clipvault-card-inner',
        });
        this.set_child(layout);

        // Header Row: Type Badge, Timestamp, Action Buttons
        const headerRow = new St.BoxLayout({
            vertical: false,
            x_expand: true,
            style_class: 'clipvault-card-header',
        });
        layout.add_child(headerRow);

        // Badge
        const typeLabel = new St.Label({
            text: (this._item.type || 'text').toUpperCase(),
            style_class: `clipvault-badge clipvault-badge-${this._item.type || 'text'}`,
            y_align: Clutter.ActorAlign.CENTER,
        });
        headerRow.add_child(typeLabel);

        // Timestamp
        const timeText = formatRelativeTime(this._item.timestamp);
        const timeLabel = new St.Label({
            text: timeText,
            style_class: 'clipvault-card-time',
            y_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
        });
        headerRow.add_child(timeLabel);

        // Actions: Pin / Unpin Button
        this._pinButton = new St.Button({
            style_class: 'clipvault-action-btn' + (this._item.pinned ? ' clipvault-pinned' : ''),
            can_focus: false,
            child: new St.Icon({
                icon_name: this._item.pinned ? 'view-pin-symbolic' : 'pin-symbolic',
                icon_size: 14,
            }),
        });
        this._pinButton.connect('clicked', () => {
            this.emit('pin-toggled');
        });
        headerRow.add_child(this._pinButton);

        // Actions: Delete Button
        this._deleteButton = new St.Button({
            style_class: 'clipvault-action-btn clipvault-delete-btn',
            can_focus: false,
            child: new St.Icon({
                icon_name: 'user-trash-symbolic',
                icon_size: 14,
            }),
        });
        this._deleteButton.connect('clicked', () => {
            this.emit('deleted');
        });
        headerRow.add_child(this._deleteButton);

        // Body Content
        if (this._item.type === ContentType.IMAGE && this._item.filePath) {
            // Image Preview
            const imgFile = Gio.File.new_for_path(this._item.filePath);
            const imageIcon = new St.Icon({
                gicon: new Gio.FileIcon({ file: imgFile }),
                icon_size: 120,
                style_class: 'clipvault-image-preview',
            });
            layout.add_child(imageIcon);
        } else {
            // Text Preview
            const previewText = this._item.preview || this._item.content || '';
            const previewLabel = new St.Label({
                text: previewText,
                style_class: 'clipvault-card-preview' + (this._item.type === ContentType.CODE ? ' clipvault-code' : ''),
                x_expand: true,
            });
            previewLabel.clutter_text.line_wrap = true;
            previewLabel.clutter_text.ellipsize = 3; // Pango.EllipsizeMode.END
            layout.add_child(previewLabel);
        }
    }
});
