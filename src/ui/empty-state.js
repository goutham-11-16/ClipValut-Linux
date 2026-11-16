/**
 * ClipVault - Empty State Component
 * Displayed when history is empty or search returns no results.
 */

import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

export const EmptyState = GObject.registerClass({
    GTypeName: 'ClipVaultEmptyState',
}, class EmptyState extends St.BoxLayout {
    _init() {
        super._init({
            vertical: true,
            x_expand: true,
            y_expand: true,
            x_align: Clutter.ActorAlign.CENTER,
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'clipvault-empty-state',
            visible: false,
        });

        this._icon = new St.Icon({
            icon_name: 'edit-copy-symbolic',
            icon_size: 48,
            style_class: 'clipvault-empty-icon',
        });
        this.add_child(this._icon);

        this._title = new St.Label({
            text: 'Clipboard history is empty',
            style_class: 'clipvault-empty-title',
        });
        this.add_child(this._title);

        this._subtitle = new St.Label({
            text: 'Copied text, links, and code will appear here.',
            style_class: 'clipvault-empty-subtitle',
        });
        this.add_child(this._subtitle);
    }

    setMessage(title, subtitle, iconName = 'edit-copy-symbolic') {
        this._title.set_text(title);
        this._subtitle.set_text(subtitle);
        this._icon.icon_name = iconName;
    }
});
