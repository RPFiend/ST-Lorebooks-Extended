// Lorebook Profiles Extension for SillyTavern
// Allows saving and activating profiles of lorebook configurations

// Extension context
let extensionName = 'lorebook-profiles';
let extensionSettings = {};
let saveSettingsDebounced = null;

// Profile data structure: { profileName: { lorebooks: [id1, id2, ...] } }

/**
 * Initialize the extension
 */
function init() {
    // Register the extension settings
    registerSettings();
    
    // Add the extension UI to the Extensions tab
    registerExtensionUI();
    
    console.log('[Lorebook Profiles] Extension initialized');
}

/**
 * Register settings with SillyTavern
 */
function registerSettings() {
    // Initialize settings if not exists
    if (!extensionSettings.profiles) {
        extensionSettings.profiles = {};
    }
    
    // Register the setting with SillyTavern's settings system
    const settingsHtml = `
        <div id="lorebook-profiles-settings">
            <h3>Lorebook Profiles</h3>
            <p>Create and manage lorebook profiles for quick switching between character setups.</p>
        </div>
    `;
    
    // This is called by SillyTavern when settings are loaded
    // The actual registration happens through the extension API
}

/**
 * Register the extension UI in the Extensions tab
 */
function registerExtensionUI() {
    const extensionId = 'lorebook-profiles';
    const displayName = 'Lorebook Profiles';
    
    // Create the UI container
    const uiContainer = document.createElement('div');
    uiContainer.id = 'lorebook-profiles-container';
    uiContainer.innerHTML = getUIHTML();
    
    // Register the extension with SillyTavern
    // This will be called when the Extensions tab is opened
    window.addEventListener('DOMContentLoaded', () => {
        renderExtensionUI();
    });
}

/**
 * Get the HTML for the extension UI
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
            .lp-create-section,
            .lp-activate-section,
            .lp-saved-section {
                margin-bottom: 20px;
                padding: 12px;
                background: var(--black30a);
                border-radius: 8px;
            }
            .lp-create-section h4,
            .lp-activate-section h4,
            .lp-saved-section h4 {
                margin: 0 0 12px 0;
                color: var(--SmartThemeBodyColor);
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
            .lp-activate-inputs {
                display: flex;
                gap: 8px;
            }
            #lp-profile-select {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid var(--SmartThemeBorderColor);
                border-radius: 4px;
                background: var(--black20a);
                color: var(--SmartThemeBodyColor);
                cursor: pointer;
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
            .lp-btn-success {
                background: #28a745;
                color: white;
            }
            .lp-btn-danger {
                background: #dc3545;
                color: white;
            }
            #lp-saved-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .lp-saved-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 12px;
                background: var(--black20a);
                border-radius: 4px;
                border: 1px solid var(--SmartThemeBorderColor);
            }
            .lp-saved-item-name {
                font-weight: 500;
                color: var(--SmartThemeBodyColor);
            }
            .lp-saved-item-count {
                color: var(--SmartThemeEmColor);
                font-size: 0.85em;
                margin-left: 8px;
            }
            .lp-saved-item-actions {
                display: flex;
                gap: 6px;
            }
            .lp-saved-item-actions .lp-btn {
                padding: 6px 12px;
                font-size: 0.85em;
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
 * Render the extension UI
 */
function renderExtensionUI() {
    // Check if the extension container already exists
    let container = document.getElementById('lorebook-profiles-container');
    
    if (!container) {
        // Wait for the Extensions tab to be available
        const checkInterval = setInterval(() => {
            const extensionsTab = document.querySelector('#extensions_content');
            if (extensionsTab) {
                clearInterval(checkInterval);
                
                container = document.createElement('div');
                container.id = 'lorebook-profiles-container';
                container.innerHTML = getUIHTML();
                extensionsTab.appendChild(container);
                
                // Attach event listeners
                attachEventListeners();
                
                // Load initial data
                refreshUI();
            }
        }, 100);
        
        // Stop checking after 10 seconds
        setTimeout(() => clearInterval(checkInterval), 10000);
    } else {
        // Reattach event listeners if container exists
        attachEventListeners();
        refreshUI();
    }
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
 * Refresh the lorebook selection list
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
 * Refresh the profile dropdown
 */
function refreshProfileDropdown() {
    const select = document.getElementById('lp-profile-select');
    if (!select) return;
    
    const profiles = extensionSettings.profiles || {};
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
 * Refresh the saved profiles list
 */
function refreshSavedProfiles() {
    const container = document.getElementById('lp-saved-list');
    if (!container) return;
    
    const profiles = extensionSettings.profiles || {};
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
    
    if (extensionSettings.profiles[profileName]) {
        if (!confirm(`A profile named "${profileName}" already exists. Overwrite it?`)) {
            return;
        }
    }
    
    // Get selected lorebooks
    const checkboxes = document.querySelectorAll('#lp-lorebook-items input[type="checkbox"]:checked');
    const selectedLorebooks = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    // Save the profile
    extensionSettings.profiles[profileName] = {
        lorebooks: selectedLorebooks,
        createdAt: Date.now()
    };
    
    // Save settings
    if (typeof saveSettingsDebounced === 'function') {
        saveSettingsDebounced();
    }
    
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
    const profile = extensionSettings.profiles[profileName];
    
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
    
    delete extensionSettings.profiles[profileName];
    
    // Save settings
    if (typeof saveSettingsDebounced === 'function') {
        saveSettingsDebounced();
    }
    
    // Refresh the UI
    refreshUI();
    
    showToast(`Profile "${profileName}" deleted`);
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

// SillyTavern extension API hook
// This is called when the extension is loaded
// Supports both automatic loading and dynamic loading without restart

// Global flag to track initialization
window.LorebookProfilesExtension = window.LorebookProfilesExtension || {
    initialized: false,
    initExtension: null
};

(function lorebookProfilesExtension() {
    'use strict';
    
    // Default settings
    const defaultSettings = {
        profiles: {}
    };
    
    /**
     * Main initialization function - can be called multiple times safely
     */
    function initialize() {
        if (window.LorebookProfilesExtension.initialized) {
            console.log('[Lorebook Profiles] Extension already initialized, refreshing...');
            refreshUI();
            return;
        }
        
        console.log('[Lorebook Profiles] Starting initialization...');
        
        // The extensionSettings object is provided by SillyTavern
        if (typeof extensionSettings !== 'undefined') {
            extensionSettings.profiles = extensionSettings.profiles || defaultSettings.profiles;
            window.LorebookProfilesExtension.settings = extensionSettings;
        } else {
            window.LorebookProfilesExtension.settings = defaultSettings;
            extensionSettings = defaultSettings;
        }
        
        // Register the extension with SillyTavern's extension system
        if (typeof registerExtension !== 'undefined') {
            try {
                registerExtension(extensionName, {
                    displayName: 'Lorebook Profiles',
                    description: 'Save and manage lorebook profiles',
                    icon: 'fa-book',
                    settingsHtml: getSettingsHtml(),
                    onSettingsLoad: function(settings) {
                        extensionSettings = settings || defaultSettings;
                        window.LorebookProfilesExtension.settings = extensionSettings;
                    },
                    onSettingsSave: function(settings) {
                        return extensionSettings;
                    }
                });
                console.log('[Lorebook Profiles] Extension registered with SillyTavern');
            } catch (e) {
                console.error('[Lorebook Profiles] Error registering extension:', e);
            }
        } else {
            console.warn('[Lorebook Profiles] registerExtension function not found, extension may not appear in menu');
        }
        
        // Initialize the extension
        init();
        
        // Add the UI to the Extensions tab
        // Watch for when the Extensions tab becomes visible
        const observeExtensionsTab = function() {
            // Try to add UI immediately if tab exists
            const extensionsContent = document.getElementById('extensions_content');
            if (extensionsContent && !document.getElementById('lorebook-profiles-container')) {
                renderExtensionUI();
                window.LorebookProfilesExtension.initialized = true;
                console.log('[Lorebook Profiles] Extension UI rendered');
            }
            
            // Set up a MutationObserver to watch for tab changes
            const tabButtons = document.querySelectorAll('.tab-button');
            tabButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    if (this.getAttribute('data-tab') === 'extensions') {
                        setTimeout(() => {
                            const extensionsContent = document.getElementById('extensions_content');
                            if (extensionsContent && !document.getElementById('lorebook-profiles-container')) {
                                console.log('[Lorebook Profiles] Extensions tab opened, rendering UI...');
                                renderExtensionUI();
                                window.LorebookProfilesExtension.initialized = true;
                            }
                        }, 100);
                    }
                });
            });
        };
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', observeExtensionsTab);
        } else {
            observeExtensionsTab();
        }
        
        // Fallback: keep trying to add UI
        const addUIInterval = setInterval(() => {
            const extensionsContent = document.getElementById('extensions_content');
            if (extensionsContent && !document.getElementById('lorebook-profiles-container')) {
                clearInterval(addUIInterval);
                renderExtensionUI();
                window.LorebookProfilesExtension.initialized = true;
                console.log('[Lorebook Profiles] Extension UI rendered via interval');
            }
        }, 100);
        
        // Stop checking after 5 seconds
        setTimeout(() => clearInterval(addUIInterval), 5000);
        
        // Listen for world info changes
        document.addEventListener('worldInfoUpdate', () => {
            refreshLorebookList();
        });
    }
    
    // Store the init function for external access
    window.LorebookProfilesExtension.initExtension = initialize;
    
    // Wait for SillyTavern to be ready
    const initInterval = setInterval(() => {
        if (typeof eventSource !== 'undefined') {
            clearInterval(initInterval);
            console.log('[Lorebook Profiles] SillyTavern detected, initializing...');
            initialize();
        }
    }, 100);
    
    // Also initialize immediately if eventSource is already available
    if (typeof eventSource !== 'undefined') {
        console.log('[Lorebook Profiles] SillyTavern already loaded, initializing immediately...');
        initialize();
    }
    
    // Stop trying after 10 seconds
    setTimeout(() => clearInterval(initInterval), 10000);
    
    // Expose a global function to manually reload the extension
    window.LorebookProfilesExtension.reload = function() {
        console.log('[Lorebook Profiles] Manual reload triggered');
        const container = document.getElementById('lorebook-profiles-container');
        if (container) {
            container.remove();
        }
        window.LorebookProfilesExtension.initialized = false;
        initialize();
    };
    
    // Expose a global function to refresh the UI
    window.LorebookProfilesExtension.refresh = function() {
        console.log('[Lorebook Profiles] UI refresh triggered');
        if (window.LorebookProfilesExtension.initialized) {
            refreshUI();
        } else {
            console.log('[Lorebook Profiles] Extension not initialized, call reload() first');
        }
    };
    
    console.log('[Lorebook Profiles] Extension script loaded');
})();

/**
 * Get settings HTML for the settings panel
 */
function getSettingsHtml() {
    return `
        <div id="lorebook-profiles-settings-panel">
            <h3>Lorebook Profiles Settings</h3>
            <p>Your profile data is automatically saved.</p>
            <div id="lp-settings-info">
                <p><strong>Total Profiles:</strong> <span id="lp-profile-count">0</span></p>
            </div>
        </div>
    `;
}