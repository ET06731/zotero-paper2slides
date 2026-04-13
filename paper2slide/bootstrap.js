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

    Services.scriptloader.loadSubScript(rootURI + "chrome/content/scripts/pdf-utils.js");
    Services.scriptloader.loadSubScript(rootURI + "chrome/content/scripts/summarizer.js");
    Services.scriptloader.loadSubScript(rootURI + "chrome/content/scripts/slide-generator.js");
    Services.scriptloader.loadSubScript(rootURI + "chrome/content/scripts/llm-service.js");
    Services.scriptloader.loadSubScript(rootURI + "chrome/content/scripts/paper2slide.js");

    Paper2Slide.init({ id, version, rootURI });

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

    // 注册 Fluent 本地化（Zotero 8 菜单必须）
    try {
        const mainWin = Zotero.getMainWindow();
        if (mainWin && mainWin.MozXULElement) {
            mainWin.MozXULElement.insertFTLIfNeeded('paper2slide.ftl');
        }
    } catch (e) {
        Zotero.debug('Paper2Slide: FTL registration failed: ' + e);
    }

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
