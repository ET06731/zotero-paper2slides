// Preferences script for Paper2Slide
// Supports per-provider API Key and Model settings

let currentProvider = 'deepseek';

function init() {
    // Load current provider first
    currentProvider = Zotero.Prefs.get('extensions.paper2slide.provider', true) || 'deepseek';

    // Initialize provider dropdown separately (not through bindPreference)
    let providerElement = document.getElementById('paper2slide-provider');
    if (providerElement) {
        providerElement.value = currentProvider;

        // Add provider change listener
        providerElement.addEventListener('command', function (event) {
            let newProvider = this.value;

            // Save previous preference first
            Zotero.Prefs.set('extensions.paper2slide.provider', newProvider, true);

            // Save current provider settings before switching
            saveProviderSettings(currentProvider);

            // Load new provider settings
            loadProviderSettings(newProvider);

            // Update current provider
            currentProvider = newProvider;

            Zotero.debug('Paper2Slide: Switched to provider ' + newProvider);
        });
    }

    // Bind non-provider-specific preferences
    bindPreference('paper2slide-baseUrl', 'extensions.paper2slide.baseUrl', '');
    bindPreference('paper2slide-language', 'extensions.paper2slide.language', 'chinese');
    bindPreference('paper2slide-prompt', 'extensions.paper2slide.prompt', 'academic');
    bindPreference('paper2slide-style', 'extensions.paper2slide.style', 'modern');
    bindPreference('paper2slide-noteTemplate', 'extensions.paper2slide.noteTemplate', '');

    // Load provider-specific settings
    loadProviderSettings(currentProvider);
}

function onProviderChange(event) {
    let newProvider = event.target.value;

    // Save current provider settings before switching
    saveProviderSettings(currentProvider);

    // Load new provider settings
    loadProviderSettings(newProvider);

    // Update current provider
    currentProvider = newProvider;

    Zotero.debug('Paper2Slide: Switched to provider ' + newProvider);
}

function loadProviderSettings(provider) {
    Zotero.debug('Paper2Slide: Loading settings for provider: ' + provider);

    // Load API Key for this provider
    let apiKeyElement = document.getElementById('paper2slide-apiKey');
    if (apiKeyElement) {
        let apiKey = Zotero.Prefs.get('extensions.paper2slide.apiKey.' + provider, true) || '';
        Zotero.debug('Paper2Slide: Setting apiKey to: ' + (apiKey ? '[hidden]' : '[empty]'));
        // Set both value property and attribute
        apiKeyElement.value = apiKey;
        apiKeyElement.setAttribute('value', apiKey);
        // Trigger input event to update UI
        apiKeyElement.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Load Model for this provider (or use default)
    let modelElement = document.getElementById('paper2slide-model');
    if (modelElement) {
        let model = Zotero.Prefs.get('extensions.paper2slide.model.' + provider, true) || '';
        Zotero.debug('Paper2Slide: Setting model to: ' + model);
        // Set both value property and attribute
        modelElement.value = model;
        modelElement.setAttribute('value', model);
        // Update placeholder with provider default
        let hint = getDefaultModelHint(provider);
        modelElement.placeholder = hint;
        modelElement.setAttribute('placeholder', hint);
        // Trigger input event to update UI
        modelElement.dispatchEvent(new Event('input', { bubbles: true }));
    }

    Zotero.debug('Paper2Slide: Loaded settings for provider ' + provider);
}

function saveProviderSettings(provider) {
    // Save API Key for this provider
    let apiKeyElement = document.getElementById('paper2slide-apiKey');
    if (apiKeyElement) {
        Zotero.Prefs.set('extensions.paper2slide.apiKey.' + provider, apiKeyElement.value, true);
    }

    // Save Model for this provider
    let modelElement = document.getElementById('paper2slide-model');
    if (modelElement) {
        Zotero.Prefs.set('extensions.paper2slide.model.' + provider, modelElement.value, true);
    }

    Zotero.debug('Paper2Slide: Saved settings for provider ' + provider);
}

function getDefaultModelHint(provider) {
    const defaults = {
        'deepseek': 'deepseek-chat',
        'openai': 'gpt-4o-mini',
        'gemini': 'gemini-1.5-flash',
        'kimi': 'moonshot-v1-8k',
        'doubao': 'doubao-pro-4k',
        'zhipu': 'glm-4-flash',
        'siliconflow': 'deepseek-ai/DeepSeek-V3.2',
        'openrouter': 'deepseek-ai/DeepSeek-V3.2',
        'custom': 'llama3'
    };
    return '留空使用默认: ' + (defaults[provider] || 'deepseek-chat');
}

function bindPreference(elementId, prefName, defaultValue) {
    let element = document.getElementById(elementId);
    if (!element) return;

    // Load current value
    let value = Zotero.Prefs.get(prefName, true);
    if (value === undefined || value === null) {
        value = defaultValue;
    }

    // Set element value based on type
    if (element.tagName === 'menulist') {
        element.value = value;
    } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.value = value;
    }

    // Add change listener
    element.addEventListener('change', function () {
        Zotero.Prefs.set(prefName, this.value, true);
        Zotero.debug('Paper2Slide: Set ' + prefName + ' = ' + this.value);
    });

    // For menulist, also listen to command
    if (element.tagName === 'menulist') {
        element.addEventListener('command', function () {
            Zotero.Prefs.set(prefName, this.value, true);
            Zotero.debug('Paper2Slide: Set ' + prefName + ' = ' + this.value);
        });
    }
}

// Save settings when page unloads
window.addEventListener('unload', function () {
    saveProviderSettings(currentProvider);
});

// Add input listeners for API Key and Model to save on change
function initProviderInputListeners() {
    let apiKeyElement = document.getElementById('paper2slide-apiKey');
    if (apiKeyElement) {
        apiKeyElement.addEventListener('change', function () {
            Zotero.Prefs.set('extensions.paper2slide.apiKey.' + currentProvider, this.value, true);
            Zotero.debug('Paper2Slide: Saved apiKey for ' + currentProvider);
        });
    }

    let modelElement = document.getElementById('paper2slide-model');
    if (modelElement) {
        modelElement.addEventListener('change', function () {
            Zotero.Prefs.set('extensions.paper2slide.model.' + currentProvider, this.value, true);
            Zotero.debug('Paper2Slide: Saved model for ' + currentProvider);
        });
    }
}

// Initialize when document is ready
if (document.readyState === 'complete') {
    init();
    initProviderInputListeners();
} else {
    window.addEventListener('load', function () {
        init();
        initProviderInputListeners();
    });
}
