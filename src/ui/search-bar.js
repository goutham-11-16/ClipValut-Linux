/**
 * ClipVault - Search Bar Component
 * Search input field with search icon, clear button, and text change events.
 */

import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

export const SearchBar = GObject.registerClass({
    GTypeName: 'ClipVaultSearchBar',
    Signals: {
        'search-changed': { param_types: [GObject.TYPE_STRING] },
    },
}, class SearchBar extends St.BoxLayout {
    _init() {
        super._init({
            vertical: false,
            style_class: 'clipvault-search-box',
            x_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });

        // Search icon
        const searchIcon = new St.Icon({
            icon_name: 'edit-find-symbolic',
            icon_size: 16,
            style_class: 'clipvault-search-icon',
        });
        this.add_child(searchIcon);

        // Text entry
        this._entry = new St.Entry({
            hint_text: 'Type to search clipboard...',
            style_class: 'clipvault-search-entry',
            can_focus: true,
            x_expand: true,
        });
        this.add_child(this._entry);

        // Clear button
        this._clearBtn = new St.Button({
            style_class: 'clipvault-search-clear-btn',
            can_focus: false,
            visible: false,
            child: new St.Icon({
                icon_name: 'edit-clear-symbolic',
                icon_size: 14,
            }),
        });
        this._clearBtn.connect('clicked', () => {
            this.clear();
        });
        this.add_child(this._clearBtn);

        // Listen to text changes
        this._entry.clutter_text.connect('text-changed', () => {
            const text = this.getText();
            this._clearBtn.visible = text.length > 0;
            this.emit('search-changed', text);
        });
    }

    get entry() {
        return this._entry;
    }

    getText() {
        return this._entry.get_text() || '';
    }

    clear() {
        this._entry.set_text('');
        this._clearBtn.visible = false;
        this.emit('search-changed', '');
    }

    grabFocus() {
        this._entry.grab_key_focus();
    }
});
