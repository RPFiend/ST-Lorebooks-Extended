// Lorebook Profiles Extension for SillyTavern
// Allows saving and activating profiles of lorebook configurations

import { saveSettingsDebounced } from "../../../../script.js";
import { extension_settings } from "../../../extensions.js";
import { getWorldInfoSettings } from "../../../world-info.js";

const SETTINGS_KEY = 'LOREBOOK_PROFILES';

// Settings structure
const settings = {
    profiles: {}
};

// Profile data structure: { profileName: { lorebooks: [id1, id2, ...] } }

/**
 * Get HTML for extension UI
 */
function getUIHTML() {
    return `
        <div class="lorebook-profiles-extension">
            <div class="lp-header">
                <h3>Lorebook Profiles</h3>
                <p class="lp-description">Save and manage lorebook configurations</p>
            </div>
            
            <!-- Create New Profile Section -->
            <div class="lp-create-section">
                <h4>Create New Profile</h4>
                <div class="lp-create-inputs">
                    <input type="text" id="lp-profile-name" placeholder="Enter profile name..." maxlength="50">
                </div>
                <div class="lp-lorebook-list">
                    <h5>Select Active Lorebooks:</h5>
                    <div id="lp-lorebook-items"></div>
                </div>
                <button id="lp-save-profile" class="lp-btn lp-btn-primary">Save Profile</button>
            </div>
            
            <!-- Activate Profile Section -->
            <div class="lp-activate-section">
                <h4>Activate Profile</h4>
                <div class="lp-activate-inputs">
                    <select id="lp-profile-select">
                        <option value="">-- Select Profile --</option>
                    </select>
                    <button id="lp-activate-profile" class="lp-btn lp-btn-success">Activate</button>
                </div>
            </div>
            
            <!-- Saved Profiles Section -->
            <div class="lp-saved-section">
                <h4>Saved Profiles</h4>
                <div id="lp-saved-list"></div>
            </div>
        </div>
    `;
}

/**
 * Render extension UI in Extensions tab
 */
function renderExtensionUI() {
    // Check if container already exists
    if (document.getElementById('lorebook-profiles-container')) {
        refreshUI();
        return;
    }
    
    // Try to append to extensions_settings (settings panel)
    const extensionsSettings = document.getElementById('extensions_settings');
    if (extensionsSettings) {
        const container = document.createElement('div');
        container.id = 'lorebook-profiles-container';
        container.innerHTML = getUIHTML();
        extensionsSettings.appendChild(container);
        attachEventListeners();
        refreshUI();
        console.log('[Lorebook Profiles] Extension UI rendered in settings panel');
        return;
    }
    
    // Fallback: Try extensions_content (main extensions tab)
    const extensionsContent = document.getElementById('extensions_content');
    if (extensionsContent) {
        const container = document.createElement('div');
        container.id = 'lorebook-profiles-container';
        container.innerHTML = getUIHTML();
        extensionsContent.appendChild(container);
        attachEventListeners();
        refreshUI();
        console.log('[Lorebook Profiles] Extension UI rendered in extensions tab');
        return;
    }
    
    // Watch for elements to appear
    const checkInterval = setInterval(() => {
        const extensionsSettings = document.getElementById('extensions_settings');
        const extensionsContent = document.getElementById('extensions_content');
        
        if (extensionsSettings && !document.getElementById('lorebook-profiles-container')) {
            clearInterval(checkInterval);
            const container = document.createElement('div');
            container.id = 'lorebook-profiles-container';
            container.innerHTML = getUIHTML();
            extensionsSettings.appendChild(container);
            attachEventListeners();
            refreshUI();
            console.log('[Lorebook Profiles] Extension UI rendered via interval (settings)');
        } else if (extensionsContent && !document.getElementById('lorebook-profiles-container')) {
            clearInterval(checkInterval);
            const container = document.createElement('div');
            container.id = 'lorebook-profiles-container';
            container.innerHTML = getUIHTML();
            extensionsContent.appendChild(container);
            attachEventListeners();
            refreshUI();
            console.log('[Lorebook Profiles] Extension UI rendered via interval (content)');
        }
    }, 100);
    
    setTimeout(() => clearInterval(checkInterval), 5000);
}

/**
 * Attach event listeners to UI elements
 */
function attachEventListeners() {
    const saveButton = document.getElementById('lp-save-profile');
    const activateButton = document.getElementById('lp-activate-profile');
    const profileSelect = document.getElementById('lp-profile-select');
    
    if (saveButton) {
        saveButton.addEventListener('click', saveProfile);
    }
    
    if (activateButton) {
        activateButton.addEventListener('click', activateProfile);
    }
}

/**
 * Get all active lorebooks from SillyTavern
 */
function getActiveLorebooks() {
    try {
        // Try to get lorebooks from the character's world info
        const characterId = this_chid;
        if (!characterId) return [];
        
        // Access the world info data structure
        if (typeof world_info !== 'undefined' && world_info.entries) {
            return Object.values(world_info.entries).map(entry => ({
                id: entry.uid,
                name: entry.name || `Lorebook Entry ${entry.uid}`,
                enabled: entry.enabled
            }));
        }
        
        return [];
    } catch (error) {
        console.error('[Lorebook Profiles] Error getting lorebooks:', error);
        return [];
    }
}

/**
 * Refresh all UI components
 */
function refreshUI() {
    refreshLorebookList();
    refreshProfileDropdown();
    refreshSavedProfiles();
}

/**
 * Refresh lorebook selection list
 */
function refreshLorebookList() {
    const container = document.getElementById('lp-lorebook-items');
    if (!container) return;
    
    const lorebooks = getActiveLorebooks();
    
    if (lorebooks.length === 0) {
        container.innerHTML = '<div class="lp-empty-state">No lorebooks found</div>';
        return;
    }
    
    container.innerHTML = lorebooks.map(lorebook => `
        <div class="lp-lorebook-item">
            <input type="checkbox" id="lp-lb-${lorebook.id}" value="${lorebook.id}" ${lorebook.enabled ? 'checked' : ''}>
            <label for="lp-lb-${lorebook.id}">${escapeHtml(lorebook.name)}</label>
        </div>
    `).join('');
}

/**
 * Refresh profile dropdown
 */
function refreshProfileDropdown() {
    const select = document.getElementById('lp-profile-select');
    if (!select) return;
    
    const profiles = settings.profiles || {};
    const profileNames = Object.keys(profiles).sort();
    
    let html = '<option value="">-- Select Profile --</option>';
    
    if (profileNames.length > 0) {
        html += profileNames.map(name => 
            `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`
        ).join('');
    }
    
    select.innerHTML = html;
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
        container.innerHTML = '<div class="lp-empty-state">No saved profiles</div>';
        return;
    }
    
    container.innerHTML = profileNames.map(name => {
        const profile = profiles[name];
        const lorebookCount = profile.lorebooks ? profile.lorebooks.length : 0;
        
        return `
            <div class="lp-saved-item">
                <div>
                    <span class="lp-saved-item-name">${escapeHtml(name)}</span>
                    <span class="lp-saved-item-count">(${lorebookCount} lorebooks)</span>
                </div>
                <div class="lp-saved-item-actions">
                    <button class="lp-btn lp-btn-success lp-activate-single" data-profile="${escapeHtml(name)}">Activate</button>
                    <button class="lp-btn lp-btn-danger lp-delete-profile" data-profile="${escapeHtml(name)}">Delete</button>
                </div>
            </div>
        `;
    }).join('');
    
    // Attach event listeners to the new buttons
    container.querySelectorAll('.lp-activate-single').forEach(btn => {
        btn.addEventListener('click', () => activateProfileByName(btn.dataset.profile));
    });
    
    container.querySelectorAll('.lp-delete-profile').forEach(btn => {
        btn.addEventListener('click', () => deleteProfile(btn.dataset.profile));
    });
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
    
    // Get selected lorebooks
    const checkboxes = document.querySelectorAll('#lp-lorebook-items input[type="checkbox"]:checked');
    const selectedLorebooks = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    // Save the profile
    settings.profiles[profileName] = {
        lorebooks: selectedLorebooks,
        createdAt: Date.now()
    };
    
    // Save settings
    saveSettings();
    
    // Clear the name input
    nameInput.value = '';
    
    // Refresh the UI
    refreshUI();
    
    // Show success message
    showToast(`Profile "${profileName}" saved successfully`);
}

/**
 * Activate a profile from the dropdown
 */
function activateProfile() {
    const select = document.getElementById('lp-profile-select');
    const profileName = select.value;
    
    if (!profileName) {
        alert('Please select a profile to activate');
        return;
    }
    
    activateProfileByName(profileName);
}

/**
 * Activate a profile by name
 */
function activateProfileByName(profileName) {
    const profile = settings.profiles[profileName];
    
    if (!profile) {
        alert(`Profile "${profileName}" not found`);
        return;
    }
    
    try {
        // Get all current lorebook entries
        if (typeof world_info !== 'undefined' && world_info.entries) {
            const entries = Object.values(world_info.entries);
            const selectedIds = new Set(profile.lorebooks || []);
            
            // Update each lorebook entry
            entries.forEach(entry => {
                const isSelected = selectedIds.has(entry.uid);
                entry.enabled = isSelected;
                
                // Update the UI for this entry if it exists
                const toggleElement = document.querySelector(`[data-uid="${entry.uid}"] .world_entry_activation_toggle`);
                if (toggleElement) {
                    toggleElement.checked = isSelected;
                }
            });
            
            // Trigger a refresh of the world info display
            if (typeof eventSource !== 'undefined') {
                eventSource.emit('refreshWorldInfo');
            }
            
            // Refresh our UI to reflect the current state
            refreshLorebookList();
            
            showToast(`Profile "${profileName}" activated`);
        } else {
            alert('Could not access lorebook data. Please try again.');
        }
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
    
    // Save settings
    saveSettings();
    
    // Refresh the UI
    refreshUI();
    
    showToast(`Profile "${profileName}" deleted`);
}

/**
 * Save settings
 */
function saveSettings() {
    if (typeof extension_settings !== 'undefined') {
        extension_settings[SETTINGS_KEY] = settings;
        if (typeof saveSettingsDebounced === 'function') {
            saveSettingsDebounced();
        }
    }
}

/**
 * Load settings
 */
function loadSettings() {
    if (typeof extension_settings !== 'undefined' && extension_settings[SETTINGS_KEY]) {
        Object.assign(settings, extension_settings[SETTINGS_KEY]);
    }
}

/**
 * Add settings UI to the settings panel
 */
function addSettings() {
    const settingsHtml = `
        <div class="lp--settings">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>Lorebook Profiles</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div class="flex-container margin5">
                        <p>Your profile data is automatically saved.</p>
                        <p><strong>Total Profiles:</strong> <span id="lp-profile-count">${Object.keys(settings.profiles).length}</span></p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const extensionsSettings = document.getElementById('extensions_settings');
    if (extensionsSettings) {
        extensionsSettings.innerHTML += settingsHtml;
    }
}

/**
 * Show a toast notification
 */
function showToast(message) {
    // Check if toast function exists in SillyTavern
    if (typeof toastr !== 'undefined') {
        toastr.success(message);
    } else {
        // Fallback: create a simple toast
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

// Initialize extension when DOM is ready
$(document).ready(function () {
    console.log('[Lorebook Profiles] Extension loaded');
    
    loadSettings();
    addSettings();
    
    // Render UI
    renderExtensionUI();
    
    // Listen for world info changes
    document.addEventListener('worldInfoUpdate', () => {
        refreshLorebookList();
    });
    
    console.log('[Lorebook Profiles] Extension initialized');
});