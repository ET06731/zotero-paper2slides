// Preferences script for Paper2Slide

function init() {
    // Bind preferences to UI elements
    bindPreference('paper2slide-provider', 'extensions.paper2slide.provider', 'deepseek');
    bindPreference('paper2slide-apiKey', 'extensions.paper2slide.apiKey', '');
    bindPreference('paper2slide-model', 'extensions.paper2slide.model', '');
    bindPreference('paper2slide-baseUrl', 'extensions.paper2slide.baseUrl', '');
    bindPreference('paper2slide-language', 'extensions.paper2slide.language', 'chinese');
    bindPreference('paper2slide-prompt', 'extensions.paper2slide.prompt', 'academic');
    bindPreference('paper2slide-style', 'extensions.paper2slide.style', 'modern');
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
    } else if (element.tagName === 'INPUT') {
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

// Initialize when document is ready
if (document.readyState === 'complete') {
    init();
} else {
    window.addEventListener('load', init);
}
