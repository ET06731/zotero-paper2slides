var Paper2Slide;

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
    Services.scriptloader.loadSubScript(rootURI + "chrome/content/scripts/paper2slide.js");

    Paper2Slide.init({ id, version, rootURI });
    Paper2Slide.addToAllWindows();

    await Zotero.uiReadyPromise;

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
