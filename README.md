# SoundTabs

Control each Firefox tab's audio individually from your desktop media controls on Linux.

Sound Tabs creates separate MPRIS media players for each browser tab playing audio. This means you can control YouTube, Spotify Web, SoundCloud, and any other audio source independently using your desktop's media keys, system tray, or any MPRIS-compatible controller — just like native desktop apps.

## Features

- 🎵 **Per-tab media controls** - Each tab gets its own MPRIS player
- ⌨️ **Media key support** - Play/pause/next/previous from your keyboard
- 🖥️ **Desktop integration** - Shows up in your system tray and media widgets
- 🎬 **Works everywhere** - YouTube, Spotify, SoundCloud, podcasts, and any site with audio/video
- 🔒 **Privacy-focused** - No data collection, works entirely locally

## Installation

Sound Tabs requires two components:

### 1. Install the Firefox Extension

Install from [Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/soundtabs/) (pending approval)

Or install from source:
```bash
git clone https://github.com/saltnpepper97/sound-tabs.git
cd sound-tabs/extension
# Load as temporary extension in Firefox (about:debugging)
```

### 2. Install the Native Messaging Host

The extension communicates with MPRIS through a native messaging bridge. 

**Install the native host manifest:**

```bash
# Create the directory if it doesn't exist
mkdir -p ~/.mozilla/native-messaging-hosts/

# Copy the manifest
cp native-host/sound_tabs_bridge.json ~/.mozilla/native-messaging-hosts/
```

**Install the Python bridge script:**

⚠️ **Note:** The Python bridge script is currently part of [Stasis](https://github.com/saltnpepper97/stasis) (a Wayland idle manager). You'll need to either:

1. **Use Stasis's script** (if you're already using Stasis):
   ```bash
   # Install from Stasis repository
   git clone https://github.com/saltnpepper97/stasis.git
   cd stasis
   # Follow Stasis installation instructions
   ```

2. **Adapt the script for standalone use** (for developers):
   - Check out the [Stasis repository](https://github.com/saltnpepper97/stasis)
   - Extract/modify the MPRIS bridge functionality for your setup
   - Place your script at `/usr/local/bin/sound_tabs_host.py`
   - Make it executable: `chmod +x /usr/local/bin/sound_tabs_host.py`

**A standalone version of the bridge script is planned for a future release.**

## Usage

1. Install both components (extension + native host)
2. Restart Firefox
3. Open any website with audio/video (YouTube, Spotify, etc.)
4. Control playback from:
   - Your keyboard media keys
   - System tray media controls
   - KDE Plasma's media widget
   - GNOME's media controls
   - Any MPRIS-compatible controller

Each tab appears as a separate player with its own controls!

## Requirements

- **Firefox** (tested on recent versions)
- **Linux** with MPRIS support (KDE Plasma, GNOME, etc.)
- **Python 3** (for the native bridge)
- **D-Bus** (standard on most Linux desktops)

## Troubleshooting

### Extension installed but media controls don't work

Check if the native host is properly connected:
1. Open Firefox's Browser Console (Ctrl+Shift+J)
2. Look for messages from Sound Tabs
3. You should see: `✓ Connected to native host`
4. If you see connection errors, verify:
   - `sound_tabs_bridge.json` is in `~/.mozilla/native-messaging-hosts/`
   - The Python script path in the JSON is correct
   - The Python script is executable

### Native host keeps disconnecting

- Ensure the Python script has proper permissions
- Check that all Python dependencies are installed
- Look for error messages in Firefox's Browser Console

### No MPRIS players appearing

- Verify your desktop environment supports MPRIS
- Test with: `busctl --user list | grep mpris`
- Check if other MPRIS apps work (VLC, Spotify, etc.)

## Development

### Project Structure
```
sound-tabs/
├── extension/           # Firefox extension
│   ├── manifest.json   # Extension manifest
│   ├── background.js   # Extension background script
│   └── content.js      # Content script for media detection
└── native-host/        # Native messaging configuration
    └── sound_tabs_bridge.json  # Native host manifest
```

### Building from Source

```bash
# Clone the repository
git clone https://github.com/saltnpepper97/soundtabs.git
cd sound-tabs

# Install the extension temporarily in Firefox
# 1. Open about:debugging
# 2. Click "This Firefox"
# 3. Click "Load Temporary Add-on"
# 4. Select manifest.json from the extension/ folder

# Install native host
mkdir -p ~/.mozilla/native-messaging-hosts/
cp native-host/sound_tabs_bridge.json ~/.mozilla/native-messaging-hosts/
```

## Privacy

Sound Tabs does **not** collect any data. All communication happens locally between:
- Firefox tabs ↔ Extension background script ↔ Native host ↔ D-Bus/MPRIS

No telemetry, no analytics, no external servers.

## Contributing

Contributions welcome! Feel free to:
- Report bugs
- Submit pull requests
- Suggest features
- Improve documentation

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- Built for the Linux desktop community
- Uses MPRIS for desktop integration
- Native messaging bridge implementation from [Stasis](https://github.com/saltnpeper97/stasis)

## Related Projects

- [Stasis](https://github.com/saltnpepper97/stasis) - Wayland idle manager (includes the MPRIS bridge)
- [Plasma Browser Integration](https://community.kde.org/Plasma/Browser_Integration) - KDE's browser integration
- [MPRIS specification](https://specifications.freedesktop.org/mpris-spec/latest/)

---

**Note:** This extension requires manual installation of the native messaging host. A future version may include an automated installer or standalone bridge script.
