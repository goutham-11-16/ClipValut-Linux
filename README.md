# ClipVault 📋
### Native Windows 11-Style Floating Clipboard History for Ubuntu GNOME (Wayland)

ClipVault is a lightweight, blazing-fast, and privacy-focused GNOME Shell extension that replicates the user experience of Windows 11 Clipboard History (`Win + V`) natively on Ubuntu GNOME Wayland.

When you copy text, URLs, code snippets, or images, ClipVault automatically captures and organizes them in secure local storage. Pressing **Super + Alt + V** brings up a modern, acrylic floating popup right next to your mouse pointer.

---

## 🌟 Key Features

- **Windows 11-Style Floating Popup**: Opens immediately adjacent to the mouse pointer, automatically clamping within monitor boundaries and screen edges.
- **Wayland Native**: Operates entirely within the GNOME Shell / Mutter compositor architecture using `Meta.Selection` and `St.Clipboard`. No X11 dependencies and no unreliable CLI pollers.
- **Smart Classification**: Detects and highlights URLs, code snippets (with syntax styling), email addresses, multiline text, and images.
- **Pinned History**: Pin frequently used snippets, commands, or templates to ensure they never get purged.
- **Instant Search**: Real-time case-insensitive search across history content, MIME types, and source application names.
- **Strict Privacy & Security**:
  - **100% Local**: No network connections, telemetry, or cloud syncing.
  - **Sensitive Data Filtering**: Ignores copies containing secret hints (e.g. `x-kde-passwordManagerHint`, `application/x-gnome-secrets`).
  - **Application Exclusions**: Pre-configured and customizable list to ignore copies from password managers (1Password, KeePassXC, Bitwarden).
  - **Private Mode**: One-click toggle in header or settings to pause history tracking.
  - **Auto-Expiration**: Configurable automatic purging of history older than *N* days.
  - **Secure Storage**: Storage files written with atomic `0600` permissions (owner read/write only).
- **Smooth Keyboard Navigation**:
  - `↑` / `↓` Arrow keys to navigate cards.
  - `Enter` to select and restore to system clipboard (closes popup and returns focus to active application for immediate `Ctrl + V`).
  - `Delete` to delete highlighted card.
  - `P` to toggle pin on highlighted card.
  - `Escape` to clear search or close popup.
- **Libadwaita Preferences**: Modern GTK4 / Libadwaita settings dialog to configure history size, shortcuts, exclusions, and popup dimensions.

---

## 🛠 Architecture & Tech Stack

```
ClipVault/
├── metadata.json                                      # GNOME Shell extension metadata
├── stylesheet.css                                     # Windows 11 acrylic shell stylesheet
├── extension.js                                       # Main extension lifecycle (enable/disable)
├── prefs.js                                           # Libadwaita GTK4 preferences dialog
├── install.sh                                         # User installation script
├── uninstall.sh                                       # Clean removal script
├── schemas/
│   └── org.gnome.shell.extensions.clipvault.gschema.xml # GSettings schema
├── src/
│   ├── core/
│   │   ├── clipboard-provider.js                     # St.Clipboard wrapper
│   │   ├── clipboard-monitor.js                      # Meta.Selection owner-changed listener
│   │   ├── clipboard-restorer.js                     # Atomic restoration without re-recording
│   │   └── mime-detector.js                          # Content classifier & secret detector
│   ├── history/
│   │   ├── history-manager.js                        # History limit, pinning, and item lifecycle
│   │   ├── storage-manager.js                        # Atomic JSON & binary image persistence
│   │   ├── deduplication.js                          # Move-to-top deduplication engine
│   │   └── search-engine.js                          # Fast multi-term search and partitioning
│   ├── ui/
│   │   ├── popup.js                                  # Windows 11 floating modal popup
│   │   ├── popup-position.js                         # Edge-aware pointer relative positioner
│   │   ├── clipboard-card.js                         # Card item with badge, preview, and actions
│   │   ├── search-bar.js                             # Real-time search entry
│   │   ├── pinned-section.js                         # Pinned items section
│   │   ├── recent-section.js                         # Recent items section
│   │   └── empty-state.js                            # Empty and zero-results state
│   ├── shortcuts/
│   │   └── keybindings.js                            # Global shortcut registration
│   ├── privacy/
│   │   ├── privacy-manager.js                        # Coordinates privacy mode & auto-cleanup
│   │   ├── exclusions.js                             # Application exclusion filter
│   │   └── cleanup.js                                # Expiration pruning logic
│   └── utils/
│       ├── constants.js                              # Schema keys, types, and defaults
│       ├── helpers.js                                # Relative timestamps and text formatting
│       └── logger.js                                 # Safe logger (never logs clipboard data)
└── tests/
    ├── run-tests.js                                  # Master test runner
    ├── test-mime-detector.js
    ├── test-deduplication.js
    ├── test-search-engine.js
    ├── test-storage-manager.js
    ├── test-history-manager.js
    ├── test-exclusions.js
    └── test-edge-cases.js
```

---

## 📦 Installation

To install ClipVault into your GNOME user extensions directory:

```bash
cd /path/to/ClipVault
./install.sh
```

### Activating the Extension
In GNOME on Wayland, newly installed user extensions are registered when GNOME Shell initializes.
1. Log out of your Ubuntu session and log back in (or restart your machine).
2. Open the **Extensions** app (or run `gnome-extensions enable clipvault@goutham.github.com`).
3. Press **Super + Alt + V** to launch ClipVault.

---

## 🧪 Verification & Testing

ClipVault includes a comprehensive automated test suite testing all core algorithms, storage integrity, deduplication, search filtering, and edge cases:

```bash
gjs -m tests/run-tests.js
```

Expected output:
```
========================================================
            Running ClipVault Test Suites               
========================================================
...
RESULTS: Passed: 90 | Failed: 0
========================================================
ALL UNIT TESTS PASSED!
```

---

## ⚙️ Configuration & GSettings

ClipVault preferences can be adjusted via the GTK4 Preferences window or through `gsettings`:

| Key | Type | Default | Description |
|---|---|---|---|
| `shortcut` | `as` | `['<Super><Alt>v']` | Global shortcut to toggle popup |
| `history-size` | `i` | `100` | Maximum unpinned history entries |
| `private-mode` | `b` | `false` | Pause clipboard history recording |
| `history-expiration-days` | `i` | `0` | Automatically purge entries older than N days |
| `excluded-apps` | `as` | `['1Password', 'keepassxc', 'bitwarden', ...]` | Window classes / App IDs ignored |
| `popup-width` | `i` | `380` | Width of popup in pixels |
| `popup-max-height` | `i` | `520` | Maximum height of popup in pixels |
| `enable-images` | `b` | `true` | Capture and preview copied images |

---

## 🗑 Uninstallation

To remove ClipVault:

```bash
./uninstall.sh
```

---

## 📄 License

GPL-3.0 or later.
