/**
 * ClipVault - Recent Section Component
 * Displays recent items in a dedicated section with title and counter badge.
 */

import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

export const RecentSection = GObject.registerClass({
    GTypeName: 'ClipVaultRecentSection',
}, class RecentSection extends St.BoxLayout {
    _init() {
        super._init({
            vertical: true,
            x_expand: true,
            style_class: 'clipvault-section',
            visible: true,
        });

        // Section Header
        const header = new St.BoxLayout({
            vertical: false,
            x_expand: true,
            style_class: 'clipvault-section-header',
        });
        this.add_child(header);

        const icon = new St.Icon({
            icon_name: 'document-open-recent-symbolic',
            icon_size: 14,
            style_class: 'clipvault-section-icon',
            y_align: Clutter.ActorAlign.CENTER,
        });
        header.add_child(icon);

        const label = new St.Label({
            text: 'RECENT',
            style_class: 'clipvault-section-title',
            y_align: Clutter.ActorAlign.CENTER,
            x_expand: true,
        });
        header.add_child(label);

        this._countBadge = new St.Label({
            text: '0',
            style_class: 'clipvault-section-count',
            y_align: Clutter.ActorAlign.CENTER,
        });
        header.add_child(this._countBadge);

        // Cards list
        this._cardsContainer = new St.BoxLayout({
            vertical: true,
            x_expand: true,
            style_class: 'clipvault-cards-list',
        });
        this.add_child(this._cardsContainer);
    }

    get cardsContainer() {
        return this._cardsContainer;
    }

    setCount(count) {
        this._countBadge.set_text(String(count));
    }

    clear() {
        this._cardsContainer.destroy_all_children();
        this.setCount(0);
    }
});
