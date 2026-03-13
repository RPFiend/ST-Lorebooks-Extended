// Lorebook Profiles Extension for SillyTavern
// Allows saving and activating profiles of lorebook configurations

const MODULE_NAME = 'lorebook_profiles';

// Get SillyTavern API
const context = SillyTavern.getContext();
const { extensionSettings, saveSettingsDebounced, eventSource, event_types } = context;

// Initialize settings if not exists
if (!extensionSettings[MODULE_NAME]) {
    extensionSettings[MODULE_NAME] = {
        profiles: {}
    };
}

// Settings structure
let settings = extensionSettings[MODULE_NAME];

// Profile data structure: { profileName: { lorebooks: [id1, id2, ...] }

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
            
            <div class="lp-activate-section">
                <h4>Activate Profile</h4>
                <div class="lp-activate-inputs">
                    <select id="lp-profile-select">
                        <option value="">-- Select Profile --</option>
                    </select>
                    <button id="lp-activate-profile" class="lp-btn lp-btn-success">Activate</button>
                </div>
            </div>
            
            <div class="lp-saved-section">
                <h4>Saved Profiles</h4>
                <div id="lp-saved-list"></div>
            </div>
        </div>
    `;
}

/**
 * Get all active lorebooks from SillyTavern
 */
function getActiveLorebooks() {
    try {
        const ctx = SillyTavern.getContext();
        
        if (ctx.worldInfo && ctx.worldInfo.entries) {
            return Object.values(ctx.worldInfo.entries).map(entry => ({
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
    
    const checkboxes = document.querySelectorAll('#lp-lorebook-items input[type="checkbox"]:checked');
    const selectedLorebooks = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    // Save the profile
    settings.profiles[profileName] = {
        lorebooks: selectedLorebooks,
        createdAt: Date.now()
    };
    
    saveSettings();
    
    nameInput.value = '';
    
    refreshUI();
    
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
        const ctx = SillyTavern.getContext();
        
        if (ctx.worldInfo && ctx.worldInfo.entries) {
            const entries = Object.values(ctx.worldInfo.entries);
            const selectedIds = new Set(profile.lorebooks || []);
            
            entries.forEach(entry => {
                const isSelected = selectedIds.has(entry.uid);
                entry.enabled = isSelected;
                
                const toggleElement = document.querySelector(`[data-uid="${entry.uid}"] .world_entry_activation_toggle`);
                if (toggleElement) {
                    toggleElement.checked = isSelected;
                }
            });
            
            if (eventSource) {
                eventSource.emit('refreshWorldInfo');
            }
            
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
    
    saveSettings();
    
    refreshUI();
    
    showToast(`Profile "${profileName}" deleted`);
}

/**
 * Save settings
 */
function saveSettings() {
    extensionSettings[MODULE_NAME] = settings;
    if (saveSettingsDebounced) {
        saveSettingsDebounced();
    }
}

/**
 * Attach event listeners to UI elements
 */
function attachEventListeners() {
    const saveButton = document.getElementById('lp-save-profile');
    const activateButton = document.getElementById('lp-activate-profile');
    
    if (saveButton) {
        saveButton.addEventListener('click', saveProfile);
    }
    
    if (activateButton) {
        activateButton.addEventListener('click', activateProfile);
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
                <b>Lorebook Profiles</b>
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