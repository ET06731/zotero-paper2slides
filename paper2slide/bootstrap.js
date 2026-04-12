var Paper2Slide;
var Paper2SlidePDF;
var Paper2SlideSummarizer;
var Paper2SlideGenerator;
var Paper2SlideLLM;

function log(msg) {
    Zotero.debug("Paper2Slide: " + msg);
}

async function install() {
    log("Installed");
}

async function startup({ id, version, resourceURI, rootURI = resourceURI.spec }) {
    log("Starting...");

    // Load scripts
    Services.scriptloader.loadSubScript(rootURI + "chrome/content/scripts/pdf-utils.js");
    Services.scriptloader.loadSubScript(rootURI + "chrome/content/scripts/summarizer.js");
    Services.scriptloader.loadSubScript(rootURI + "chrome/content/scripts/slide-generator.js");
    Services.scriptloader.loadSubScript(rootURI + "chrome/content/scripts/llm-service.js");
    Services.scriptloader.loadSubScript(rootURI + "chrome/content/scripts/paper2slide.js");

    Paper2Slide.init({ id, version, rootURI });

    // 等待 UI 就绪后再注入菜单和注册设置面板
    await Zotero.uiReadyPromise;

    Paper2Slide.addToAllWindows();

    // Register preferences pane
    Zotero.PreferencePanes.register({
        pluginID: 'paper2slide@ET06731.gemini',
        src: rootURI + 'chrome/content/preferences.xhtml',
        label: 'Paper2Slide',
        image: rootURI + 'chrome/content/icons/icon.png',
        scripts: [rootURI + 'chrome/content/scripts/preferences.js']
    });

    log("Started");
}

function shutdown() {
    log("Shutting down...");
    Paper2Slide?.removeFromAllWindows();
    Paper2Slide = undefined;
}

function uninstall() {
    log("Uninstalled");
}
