// Lorebook Profiles Extension for SillyTavern
// Allows saving and activating profiles of lorebook configurations

import { eventSource, event_types, saveSettingsDebounced } from '../../../../script.js';
import { extension_settings } from '../../../extensions.js';
import { executeSlashCommands } from '../../../slash-commands.js';

const MODULE_NAME = 'lorebook_profiles';

// Initialize settings from extension_settings
if (!extension_settings[MODULE_NAME]) {
    extension_settings[MODULE_NAME] = {
        profiles: {}
    };
}

// Settings structure
const settings = extension_settings[MODULE_NAME];

// Profile data structure: { profileName: { lorebooks: [name1, name2, ...] }

/**
 * Get HTML for extension UI
 */
function getUIHTML() {
    return `
        <div class="lorebook-profiles-extension">
            <div class="lp-header">
                <h3>LoreProfiles!</h3>
                <p class="lp-description">Save and manage lorebook configurations</p>
            </div>
            
            <!-- Section 1: Saved Profiles (always visible) -->
            <div class="lp-saved-section">
                <h4>Saved Profiles</h4>
                <div id="lp-saved-list"></div>
            </div>
            
            <!-- Section 2: Create New Profile (collapsed by default) -->
            <div class="lp-create-section">
                <button id="lp-toggle-create" class="lp-btn lp-btn-secondary lp-toggle-create">
                    + New Profile
                </button>
                <div id="lp-create-form" class="lp-create-form hidden">
                    <div class="lp-create-inputs">
                        <input type="text" id="lp-profile-name" placeholder="Enter profile name..." maxlength="50">
                    </div>
                    <div class="lp-lorebook-list">
                        <h5>Select Active Lorebooks:</h5>
                        <button id="lp-refresh-lorebooks" class="lp-btn lp-btn-small">Refresh List</button>
                        <div id="lp-lorebook-items"></div>
                    </div>
                    <button id="lp-save-profile" class="lp-btn lp-btn-primary">Save Profile</button>
                </div>
            </div>
        </div>
        
        <style>
            .lorebook-profiles-extension {
                padding: 16px;
                font-family: var(--font-main, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif);
            }
            .lp-header h3 {
                margin: 0 0 8px 0;
                color: var(--SmartThemeBodyColor);
            }
            .lp-description {
                margin: 0 0 16px 0;
                color: var(--SmartThemeEmColor);
                font-size: 0.9em;
            }
            .lp-saved-section {
                margin-bottom: 20px;
                padding: 12px;
                background: var(--black30a);
                border-radius: 8px;
            }
            .lp-saved-section h4 {
                margin: 0 0 12px 0;
                color: var(--SmartThemeBodyColor);
            }
            .lp-saved-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 12px;
                background: var(--black20a);
                border-radius: 4px;
                border: 1px solid var(--SmartThemeBorderColor);
                margin-bottom: 8px;
            }
            .lp-saved-item-info {
                flex: 1;
            }
            .lp-saved-item-name {
                font-weight: 500;
                color: var(--SmartThemeBodyColor);
                font-size: 1em;
            }
            .lp-saved-item-subtitle {
                color: var(--SmartThemeEmColor);
                font-size: 0.85em;
                margin-top: 4px;
            }
            .lp-saved-item-actions {
                display: flex;
                gap: 6px;
            }
            .lp-btn-small {
                padding: 6px 12px;
                font-size: 0.85em;
            }
            .lp-toggle-create {
                width: 100%;
                margin-bottom: 0;
            }
            .lp-create-section {
                margin-bottom: 20px;
            }
            .lp-create-form {
                margin-top: 12px;
                padding: 12px;
                background: var(--black30a);
                border-radius: 8px;
            }
            .lp-create-form.hidden {
                display: none;
            }
            .lp-create-inputs {
                margin-bottom: 12px;
            }
            #lp-profile-name {
                width: 100%;
                padding: 8px 12px;
                border: 1px solid var(--SmartThemeBorderColor);
                border-radius: 4px;
                background: var(--black20a);
                color: var(--SmartThemeBodyColor);
                box-sizing: border-box;
                font-size: 14px;
            }
            #lp-profile-name:focus {
                outline: none;
                border-color: var(--SmartThemeAccentColor);
            }
            .lp-lorebook-list {
                margin-bottom: 12px;
            }
            .lp-lorebook-list h5 {
                margin: 0 0 8px 0;
                color: var(--SmartThemeBodyColor);
                font-size: 0.9em;
            }
            #lp-lorebook-items {
                max-height: 200px;
                overflow-y: auto;
                border: 1px solid var(--SmartThemeBorderColor);
                border-radius: 4px;
                padding: 8px;
                background: var(--black20a);
            }
            .lp-lorebook-item {
                display: flex;
                align-items: center;
                padding: 6px 8px;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.2s;
            }
            .lp-lorebook-item:hover {
                background: var(--black50a);
            }
            .lp-lorebook-item input[type="checkbox"] {
                margin-right: 8px;
                cursor: pointer;
            }
            .lp-lorebook-item label {
                cursor: pointer;
                flex: 1;
                color: var(--SmartThemeBodyColor);
            }
            .lp-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.2s;
            }
            .lp-btn:hover {
                opacity: 0.9;
                transform: translateY(-1px);
            }
            .lp-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }
            .lp-btn-primary {
                background: var(--SmartThemeAccentColor);
                color: var(--SmartThemeBodyColor);
            }
            .lp-btn-secondary {
                background: #6c757d;
                color: white;
            }
            .lp-btn-success {
                background: #28a745;
                color: white;
            }
            .lp-btn-danger {
                background: #dc3545;
                color: white;
            }
            .lp-empty-state {
                color: var(--SmartThemeEmColor);
                font-style: italic;
                padding: 12px;
                text-align: center;
            }
        </style>
    `;
}

/**
 * Get all available lorebooks from SillyTavern's World Info dropdown
 */
function getAvailableLorebooks() {
    try {
        const sel = document.querySelector('#world_editor_select');
        
        if (!sel) {
            console.warn('[Lorebook Profiles] World Info dropdown not found. Make sure World Info panel is open.');
            return [];
        }
        
        if (!sel.children || sel.children.length === 0) {
            console.warn('[Lorebook Profiles] World Info dropdown has no options.');
            return [];
        }
        
        console.log('[Lorebook Profiles] Found dropdown with', sel.children.length, 'options');
        
        // Filter out blank or --- entries
        const bookNames = Array.from(sel.children)
            .map(option => ({
                name: option.textContent,
                value: option.value,
                enabled: option.selected
            }))
            .filter(book => book.value && !book.name.trim().startsWith('---'));
        
        console.log('[Lorebook Profiles] Lorebooks loaded:', bookNames);
        return bookNames;
    } catch (error) {
        console.error('[Lorebook Profiles] Error getting lorebooks:', error);
        return [];
    }
}

/**
 * Toggle create form visibility
 */
function toggleCreateForm() {
    const form = document.getElementById('lp-create-form');
    const toggleBtn = document.getElementById('lp-toggle-create');
    
    if (form.classList.contains('hidden')) {
        form.classList.remove('hidden');
        toggleBtn.textContent = '- New Profile';
    } else {
        form.classList.add('hidden');
        toggleBtn.textContent = '+ New Profile';
    }
}

/**
 * Refresh all UI components
 */
function refreshUI() {
    refreshSavedProfiles();
    refreshLorebookList();
}

/**
 * Refresh saved profiles list
 */
function refreshSavedProfiles() {
    const container = document.getElementById('lp-saved-list');
    if (!container) return;
    
    const profiles = settings.profiles || {};
    const profileNames = Object.keys(profiles).sort();
    
    if (profileNames.length === 0) {
        container.innerHTML = '<div class="lp-empty-state">No profiles yet. Create one below.</div>';
        return;
    }
    
    container.innerHTML = profileNames.map(name => {
        const profile = profiles[name];
        const lorebookCount = profile.worldList ? profile.worldList.length : 0;
        const lorebookNames = profile.worldList ? profile.worldList.join(', ') : '';
        
        return `
            <div class="lp-saved-item">
                <div class="lp-saved-item-info">
                    <div class="lp-saved-item-name">${escapeHtml(name)}</div>
                    <div class="lp-saved-item-subtitle">${escapeHtml(lorebookNames)}</div>
                </div>
                <div class="lp-saved-item-actions">
                    <button class="lp-btn lp-btn-success lp-btn-small lp-activate-single" data-profile="${escapeHtml(name)}">Activate</button>
                    <button class="lp-btn lp-btn-danger lp-btn-small lp-delete-profile" data-profile="${escapeHtml(name)}">✕</button>
                </div>
            </div>
        `;
    }).join('');
    
    container.querySelectorAll('.lp-activate-single').forEach(btn => {
        btn.addEventListener('click', () => activateProfileByName(btn.dataset.profile));
    });
    
    container.querySelectorAll('.lp-delete-profile').forEach(btn => {
        btn.addEventListener('click', () => deleteProfile(btn.dataset.profile));
    });
}

/**
 * Refresh lorebook selection list
 */
function refreshLorebookList() {
    const container = document.getElementById('lp-lorebook-items');
    if (!container) return;
    
    const lorebooks = getAvailableLorebooks();
    
    if (lorebooks.length === 0) {
        container.innerHTML = '<div class="lp-empty-state">No lorebooks found. Please open World Info panel first, then click "Refresh List".</div>';
        return;
    }
    
    container.innerHTML = lorebooks.map(lorebook => `
        <div class="lp-lorebook-item">
            <input type="checkbox" id="lp-lb-${lorebook.value}" value="${lorebook.name}" ${lorebook.enabled ? 'checked' : ''}>
            <label for="lp-lb-${lorebook.value}">${escapeHtml(lorebook.name)}</label>
        </div>
    `).join('');
}

/**
 * Save a new profile
 */
function saveProfile() {
    const nameInput = document.getElementById('lp-profile-name');
    const profileName = nameInput.value.trim();
    
    if (!profileName) {
        alert('Please enter a profile name');
        return;
    }
    
    if (settings.profiles[profileName]) {
        if (!confirm(`A profile named "${profileName}" already exists. Overwrite it?`)) {
            return;
        }
    }
    
    const checkboxes = document.querySelectorAll('#lp-lorebook-items input[type="checkbox"]:checked');
    const selectedLorebooks = Array.from(checkboxes).map(cb => cb.value);
    
    // Save profile using same structure as WorldInfoPresets
    settings.profiles[profileName] = {
        worldList: selectedLorebooks
    };
    
    saveSettingsDebounced();
    
    // Clear form and collapse it
    nameInput.value = '';
    toggleCreateForm();
    
    // Refresh UI
    refreshSavedProfiles();
    refreshLorebookList();
    
    showToast(`Profile "${profileName}" saved successfully`);
}

/**
 * Activate a profile by name using /world slash commands
 */
async function activateProfileByName(profileName) {
    const profile = settings.profiles[profileName];
    
    if (!profile) {
        alert(`Profile "${profileName}" not found`);
        return;
    }
    
    try {
        // Deactivate all lorebooks first - exact pattern from WorldInfoPresets
        await executeSlashCommands('/world silent=true {{newline}}');
        
        // Activate each lorebook in the profile - exact pattern from WorldInfoPresets
        for (const world of profile.worldList) {
            await executeSlashCommands(`/world silent=true ${world}`);
        }
        
        // Refresh lorebook list to reflect current state
        refreshLorebookList();
        
        showToast(`Profile "${profileName}" activated with ${profile.worldList.length} lorebook(s)`);
    } catch (error) {
        console.error('[Lorebook Profiles] Error activating profile:', error);
        alert('Error activating profile: ' + error.message);
    }
}

/**
 * Delete a profile
 */
function deleteProfile(profileName) {
    if (!confirm(`Are you sure you want to delete the profile "${profileName}"?`)) {
        return;
    }
    
    delete settings.profiles[profileName];
    
    saveSettingsDebounced();
    
    refreshSavedProfiles();
    
    showToast(`Profile "${profileName}" deleted`);
}

/**
 * Attach event listeners to UI elements
 */
function attachEventListeners() {
    const toggleBtn = document.getElementById('lp-toggle-create');
    const saveButton = document.getElementById('lp-save-profile');
    const refreshButton = document.getElementById('lp-refresh-lorebooks');
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleCreateForm);
    }
    
    if (saveButton) {
        saveButton.addEventListener('click', saveProfile);
    }
    
    if (refreshButton) {
        refreshButton.addEventListener('click', refreshLorebookList);
    }
}

/**
 * Show a toast notification
 */
function showToast(message) {
    if (typeof toastr !== 'undefined') {
        toastr.success(message);
    } else {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            background: var(--SmartThemeAccentColor);
            color: var(--SmartThemeBodyColor);
            border-radius: 4px;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize extension UI
jQuery(async () => {
    console.log('[Lorebook Profiles] Registering extension...');
    
    const settingsHtml = `
        <div id="lorebook-profiles-settings" class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>SillyTavern - LoreProfiles!</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div class="flex-container margin5">
                    <p>Your profile data is automatically saved.</p>
                    <p><strong>Total Profiles:</strong> <span id="lp-profile-count">${Object.keys(settings.profiles).length}</span></p>
                    <div id="lorebook-profiles-main-ui"></div>
                </div>
            </div>
        </div>
    `;
    
    $('#extensions_settings').append(settingsHtml);
    
    const checkInterval = setInterval(() => {
        const mainContainer = document.getElementById('lorebook-profiles-main-ui');
        if (mainContainer && !mainContainer.hasChildNodes()) {
            clearInterval(checkInterval);
            console.log('[Lorebook Profiles] UI container found, rendering...');
            mainContainer.innerHTML = getUIHTML();
            attachEventListeners();
            refreshUI();
        }
    }, 100);
    
    setTimeout(() => clearInterval(checkInterval), 5000);
    
    setTimeout(() => {
        const mainContainer = document.getElementById('lorebook-profiles-main-ui');
        if (mainContainer && !mainContainer.hasChildNodes()) {
            console.log('[Lorebook Profiles] Attempting immediate UI render...');
            mainContainer.innerHTML = getUIHTML();
            attachEventListeners();
            refreshUI();
        }
    }, 500);
    
    if (eventSource) {
        eventSource.on(event_types.CHAT_CHANGED, () => {
            const mainContainer = document.getElementById('lorebook-profiles-main-ui');
            if (mainContainer) {
                refreshUI();
            }
        });
    }
    
    console.log('[Lorebook Profiles] Extension registered');
});
