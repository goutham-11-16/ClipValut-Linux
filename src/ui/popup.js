/**
 * ClipVault - Floating Popup Component
 * Windows 11-inspired floating clipboard history popup for GNOME Shell on Wayland.
 */

import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Shell from 'gi://Shell';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { SearchBar } from './search-bar.js';
import { PinnedSection } from './pinned-section.js';
import { RecentSection } from './recent-section.js';
import { EmptyState } from './empty-state.js';
import { ClipboardCard } from './clipboard-card.js';
import { PopupPositioner } from './popup-position.js';
import { SettingsKeys, Defaults } from '../utils/constants.js';
import * as Logger from '../utils/logger.js';

export const ClipVaultPopup = GObject.registerClass({
    GTypeName: 'ClipVaultPopup',
    Signals: {
        'closed': {},
    },
}, class ClipVaultPopup extends St.Widget {
    _init(extension, historyManager, clipboardRestorer, privacyManager, options = {}) {
        super._init({
            style_class: 'clipvault-backdrop',
            reactive: true,
            visible: false,
            x: 0,
            y: 0,
        });

        this._extension = extension;
        this._history = historyManager;
        this._restorer = clipboardRestorer;
        this._privacy = privacyManager;
        this._options = options;

        this._popupWidth = options.width || Defaults.POPUP_WIDTH;
        this._popupMaxHeight = options.maxHeight || Defaults.POPUP_MAX_HEIGHT;

        this._grab = null;
        this._cards = [];
        this._selectedIndex = -1;
        this._activeQuery = '';

        // Fill stage to capture background clicks
        this.add_constraint(new Clutter.BindConstraint({
            source: global.stage,
            coordinate: Clutter.BindCoordinate.ALL,
        }));

        this._buildUi();

        // Listen for history updates while popup is open
        this._unsubscribeHistory = this._history.subscribe(() => {
            this._renderHistory();
        });
    }

    _buildUi() {
        // Main floating panel card
        this._panel = new St.BoxLayout({
            vertical: true,
            style_class: 'clipvault-panel',
            reactive: true,
            can_focus: true,
            width: this._popupWidth,
        });
        this.add_child(this._panel);

        // Header
        const header = new St.BoxLayout({
            vertical: false,
            style_class: 'clipvault-header',
            x_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._panel.add_child(header);

        // App Logo / Title
        const titleBox = new St.BoxLayout({
            vertical: false,
            style_class: 'clipvault-title-box',
            x_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        header.add_child(titleBox);

        const logoIcon = new St.Icon({
            icon_name: 'edit-paste-symbolic',
            icon_size: 16,
            style_class: 'clipvault-title-icon',
        });
        titleBox.add_child(logoIcon);

        const titleLabel = new St.Label({
            text: 'Clipboard History',
            style_class: 'clipvault-title-text',
            y_align: Clutter.ActorAlign.CENTER,
        });
        titleBox.add_child(titleLabel);

        // Header Action: Private Mode Toggle
        this._privateToggleBtn = new St.Button({
            style_class: 'clipvault-header-btn' + (this._privacy && this._privacy.isPrivateMode ? ' active' : ''),
            can_focus: false,
            child: new St.Icon({
                icon_name: 'security-high-symbolic',
                icon_size: 16,
            }),
        });
        this._privateToggleBtn.connect('clicked', () => {
            if (this._privacy) {
                this._privacy.isPrivateMode = !this._privacy.isPrivateMode;
                this._updatePrivateModeUi();
            }
        });
        header.add_child(this._privateToggleBtn);

        // Header Action: Clear Unpinned
        const clearBtn = new St.Button({
            style_class: 'clipvault-header-btn',
            can_focus: false,
            child: new St.Icon({
                icon_name: 'edit-clear-all-symbolic',
                icon_size: 16,
            }),
        });
        clearBtn.connect('clicked', () => {
            this._history.clearUnpinned();
        });
        header.add_child(clearBtn);

        // Header Action: Settings
        const settingsBtn = new St.Button({
            style_class: 'clipvault-header-btn',
            can_focus: false,
            child: new St.Icon({
                icon_name: 'emblem-system-symbolic',
                icon_size: 16,
            }),
        });
        settingsBtn.connect('clicked', () => {
            this.close();
            if (this._extension && typeof this._extension.openPreferences === 'function') {
                this._extension.openPreferences();
            }
        });
        header.add_child(settingsBtn);

        // Header Action: Close (X)
        const closeBtn = new St.Button({
            style_class: 'clipvault-header-btn clipvault-close-btn',
            can_focus: false,
            child: new St.Icon({
                icon_name: 'window-close-symbolic',
                icon_size: 16,
            }),
        });
        closeBtn.connect('clicked', () => {
            this.close();
        });
        header.add_child(closeBtn);

        // Search Bar
        this._searchBar = new SearchBar();
        this._searchBar.connect('search-changed', (_bar, query) => {
            this._activeQuery = query;
            this._renderHistory();
        });
        this._panel.add_child(this._searchBar);

        // Scrollable List Area
        this._scrollView = new St.ScrollView({
            style_class: 'clipvault-scrollview',
            overlay_scrollbars: true,
            x_expand: true,
            y_expand: true,
            height: Math.min(this._popupMaxHeight - 140, 380),
        });
        this._panel.add_child(this._scrollView);

        this._contentBox = new St.BoxLayout({
            vertical: true,
            style_class: 'clipvault-content-box',
            x_expand: true,
        });
        this._scrollView.set_child(this._contentBox);

        // Pinned Section
        this._pinnedSection = new PinnedSection();
        this._contentBox.add_child(this._pinnedSection);

        // Recent Section
        this._recentSection = new RecentSection();
        this._contentBox.add_child(this._recentSection);

        // Empty State
        this._emptyState = new EmptyState();
        this._contentBox.add_child(this._emptyState);

        // Footer
        const footer = new St.BoxLayout({
            vertical: false,
            style_class: 'clipvault-footer',
            x_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._panel.add_child(footer);

        this._countLabel = new St.Label({
            text: '0 items',
            style_class: 'clipvault-footer-text',
            y_align: Clutter.ActorAlign.CENTER,
        });
        footer.add_child(this._countLabel);

        const spacer = new St.Widget({ x_expand: true });
        footer.add_child(spacer);

        this._privacyLabel = new St.Label({
            text: 'Private mode: OFF',
            style_class: 'clipvault-footer-status',
            y_align: Clutter.ActorAlign.CENTER,
        });
        footer.add_child(this._privacyLabel);

        this._updatePrivateModeUi();
    }

    _updatePrivateModeUi() {
        const isPrivate = this._privacy && this._privacy.isPrivateMode;
        if (this._privateToggleBtn) {
            if (isPrivate) {
                this._privateToggleBtn.add_style_pseudo_class('active');
            } else {
                this._privateToggleBtn.remove_style_pseudo_class('active');
            }
        }
        if (this._privacyLabel) {
            this._privacyLabel.set_text(isPrivate ? 'Private mode: ON' : 'Private mode: OFF');
            if (isPrivate) {
                this._privacyLabel.add_style_class_name('active');
            } else {
                this._privacyLabel.remove_style_class_name('active');
            }
        }
    }

    _renderHistory() {
        this._cards = [];
        this._selectedIndex = -1;

        this._pinnedSection.clear();
        this._recentSection.clear();

        const { pinned, recent } = this._activeQuery
            ? this._history.search(this._activeQuery)
            : this._history.getPartitioned();

        const totalItems = pinned.length + recent.length;

        if (totalItems === 0) {
            this._pinnedSection.visible = false;
            this._recentSection.visible = false;
            this._emptyState.visible = true;
            if (this._activeQuery) {
                this._emptyState.setMessage(
                    'No results found',
                    `No clipboard items matched "${this._activeQuery}".`,
                    'edit-find-symbolic'
                );
            } else {
                this._emptyState.setMessage(
                    'Clipboard is empty',
                    'Copy text, links, or code to start using history.',
                    'edit-copy-symbolic'
                );
            }
        } else {
            this._emptyState.visible = false;

            // Render Pinned items
            if (pinned.length > 0) {
                this._pinnedSection.setCount(pinned.length);
                for (const item of pinned) {
                    const card = this._createCard(item);
                    this._pinnedSection.cardsContainer.add_child(card);
                    this._cards.push(card);
                }
            } else {
                this._pinnedSection.visible = false;
            }

            // Render Recent items
            if (recent.length > 0) {
                this._recentSection.setCount(recent.length);
                this._recentSection.visible = true;
                for (const item of recent) {
                    const card = this._createCard(item);
                    this._recentSection.cardsContainer.add_child(card);
                    this._cards.push(card);
                }
            } else {
                this._recentSection.visible = false;
            }
        }

        if (this._countLabel) {
            this._countLabel.set_text(`${totalItems} items`);
        }

        // Highlight first card by default if cards exist
        if (this._cards.length > 0) {
            this._selectCardIndex(0);
        }
    }

    _createCard(item) {
        const card = new ClipboardCard(item);

        card.connect('selected', async () => {
            await this._restoreItem(item);
        });

        card.connect('pin-toggled', () => {
            this._history.togglePin(item.id);
        });

        card.connect('deleted', () => {
            this._history.deleteItem(item.id);
        });

        return card;
    }

    _selectCardIndex(index) {
        if (this._cards.length === 0) {
            this._selectedIndex = -1;
            return;
        }

        const clamped = Math.max(0, Math.min(index, this._cards.length - 1));

        if (this._selectedIndex >= 0 && this._selectedIndex < this._cards.length) {
            this._cards[this._selectedIndex].setSelected(false);
        }

        this._selectedIndex = clamped;
        const currentCard = this._cards[this._selectedIndex];
        currentCard.setSelected(true);

        // Ensure visible in scroll view
        const adjustment = this._scrollView.vscroll.adjustment;
        const [cardY, cardH] = [currentCard.y, currentCard.height];
        const scrollVal = adjustment.value;
        const pageH = adjustment.page_size;

        if (cardY < scrollVal) {
            adjustment.set_value(cardY);
        } else if (cardY + cardH > scrollVal + pageH) {
            adjustment.set_value(cardY + cardH - pageH + 20);
        }
    }

    async _restoreItem(item) {
        try {
            await this._restorer.restore(item);
        } finally {
            this.close();
        }
    }

    open() {
        if (this.visible) return;

        Main.uiGroup.add_child(this);

        this._updatePrivateModeUi();
        this._renderHistory();

        // Calculate positioning near mouse pointer
        const estimatedHeight = Math.min(this._popupMaxHeight, 460);
        const { x, y } = PopupPositioner.calculatePosition(this._popupWidth, estimatedHeight);
        this._panel.set_position(x, y);

        // Modal grab
        this._grab = Main.pushModal(this, {
            actionMode: Shell.ActionMode.ALL,
        });

        this.opacity = 0;
        this.show();
        this.ease({
            opacity: 255,
            duration: 120,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            onComplete: () => {
                this._searchBar.grabFocus();
            },
        });
    }

    close() {
        if (!this.visible) return;

        if (this._grab) {
            Main.popModal(this._grab);
            this._grab = null;
        }

        if (this._unsubscribeHistory) {
            this._unsubscribeHistory();
            this._unsubscribeHistory = null;
        }

        this.ease({
            opacity: 0,
            duration: 100,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            onComplete: () => {
                this.hide();
                this.emit('closed');
                this.destroy();
            },
        });
    }

    vfunc_button_press_event(event) {
        const [x, y] = event.get_coords();
        const [panelX, panelY] = this._panel.get_transformed_position();
        const [panelW, panelH] = this._panel.get_transformed_size();

        // If clicked outside panel card, close popup
        if (x < panelX || x > panelX + panelW || y < panelY || y > panelY + panelH) {
            this.close();
            return Clutter.EVENT_STOP;
        }

        return Clutter.EVENT_PROPAGATE;
    }

    vfunc_key_press_event(event) {
        const symbol = event.get_key_symbol();

        if (symbol === Clutter.KEY_Escape) {
            if (this._searchBar.getText().length > 0) {
                this._searchBar.clear();
            } else {
                this.close();
            }
            return Clutter.EVENT_STOP;
        }

        if (symbol === Clutter.KEY_Down) {
            if (this._cards.length > 0) {
                this._selectCardIndex(this._selectedIndex + 1);
            }
            return Clutter.EVENT_STOP;
        }

        if (symbol === Clutter.KEY_Up) {
            if (this._cards.length > 0) {
                this._selectCardIndex(this._selectedIndex - 1);
            }
            return Clutter.EVENT_STOP;
        }

        if (symbol === Clutter.KEY_Return || symbol === Clutter.KEY_KP_Enter) {
            if (this._selectedIndex >= 0 && this._selectedIndex < this._cards.length) {
                const card = this._cards[this._selectedIndex];
                this._restoreItem(card.item);
                return Clutter.EVENT_STOP;
            }
        }

        if (symbol === Clutter.KEY_Delete) {
            if (this._selectedIndex >= 0 && this._selectedIndex < this._cards.length) {
                const card = this._cards[this._selectedIndex];
                this._history.deleteItem(card.item.id);
                return Clutter.EVENT_STOP;
            }
        }

        if (symbol === Clutter.KEY_p || symbol === Clutter.KEY_P) {
            // If focus is not actively typing in search entry, toggle pin on selected card
            const keyFocus = global.stage.get_key_focus();
            if (keyFocus !== this._searchBar.entry.clutter_text) {
                if (this._selectedIndex >= 0 && this._selectedIndex < this._cards.length) {
                    const card = this._cards[this._selectedIndex];
                    this._history.togglePin(card.item.id);
                    return Clutter.EVENT_STOP;
                }
            }
        }

        return Clutter.EVENT_PROPAGATE;
    }
});
