# Lorebook Profiles Extension for SillyTavern

A SillyTavern extension that allows you to save and manage profiles of lorebook configurations. Perfect for quickly switching between different character setups or scenarios.

## Features

- **Save Profiles**: Create named profiles with your selected lorebooks
- **Quick Activation**: Activate a saved profile to instantly toggle the right lorebooks on and others off
- **Multi-Select UI**: Easy-to-use interface to select which lorebooks to include in a profile
- **Profile Management**: View, activate, and delete saved profiles
- **Persistent Storage**: Profiles are saved using SillyTavern's built-in settings system

  ## Installation

  ### Using SillyTavern's Built-in Git Installer

  1. Upload this extension to a GitHub repository
  2. Open SillyTavern
  3. Navigate to **Settings** → **Extensions**
  4. Click the **"Install Extension"** button
  5. Paste the GitHub repository URL (e.g., `https://github.com/username/ST-Lorebooks-Extended`)
  6. Click **Install** and wait for the installation to complete
  7. The extension will appear in the Extensions tab immediately (no restart required!)

  **Note:** Ensure the repository contains `manifest.json` and `index.js` at the root level.

### Dynamic Loading

This extension supports dynamic loading, meaning it activates immediately after installation without requiring a SillyTavern restart.

## Usage

### Creating a Profile

1. Open SillyTavern and navigate to the **Extensions** tab
2. Find the **Lorebook Profiles** section
3. Enter a name for your profile in the "Enter profile name..." field
4. Select which lorebooks you want to include in the profile using the checkboxes
5. Click the **Save Profile** button

### Activating a Profile

**Method 1 - Dropdown:**
1. In the "Activate Profile" section, select a profile from the dropdown
2. Click the **Activate** button

**Method 2 - Direct Activation:**
1. In the "Saved Profiles" section, find your desired profile
2. Click the **Activate** button next to it

The extension will:
- Enable all lorebooks in the selected profile
- Disable all other lorebooks globally
- Refresh the lorebook display to reflect the changes

### Deleting a Profile

1. In the "Saved Profiles" section, find the profile you want to delete
2. Click the **Delete** button next to it
3. Confirm the deletion in the popup dialog

## How It Works

The extension integrates with SillyTavern's world info system to:
- Read all available lorebook entries and their current enabled state
- Save profile configurations as arrays of lorebook IDs
- Toggle lorebook entries on/off when a profile is activated
- Persist profile data using SillyTavern's `extensionSettings` and `saveSettingsDebounced()`

## Technical Details

- **Language**: Plain JavaScript (no dependencies)
- **Storage**: Uses SillyTavern's built-in extension settings system
- **Compatibility**: Works with SillyTavern's world info/lorebook system
- **UI**: Custom-styled interface that adapts to SillyTavern's theme

## Profile Data Structure

Profiles are stored as:

```javascript
{
  profiles: {
    "Profile Name": {
      lorebooks: [123, 456, 789],  // Array of lorebook IDs
      createdAt: 1234567890         // Timestamp
    }
  }
}
```

## Troubleshooting

**Extension doesn't appear in Extensions tab:**
- Verify that both `manifest.json` and `index.js` are in the correct folder
- Restart SillyTavern completely
- Check the browser console for any error messages

**Lorebooks don't toggle when activating a profile:**
- Ensure you're using a character that has lorebooks attached
- Check that the profile contains valid lorebook IDs
- Try refreshing the page

**Profiles disappear after restarting:**
- This should not happen as profiles use SillyTavern's persistent storage
- Check the browser console for any storage-related errors

## Credits

Created for the SillyTavern community.

## License

This extension is provided as-is for use with SillyTavern.