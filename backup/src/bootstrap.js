var Paper2Slide;
var Paper2SlidePDF;
var Paper2SlideSummarizer;
var Paper2SlideGenerator;

function install() {
}

function startup({ id, version, resourceURI, rootURI = resourceURI.spec }, reason) {
    // Load libraries
    Services.scriptloader.loadSubScript(rootURI + 'src/lib/pdf-utils.js');
    Services.scriptloader.loadSubScript(rootURI + 'src/lib/summarizer.js');
    Services.scriptloader.loadSubScript(rootURI + 'src/lib/slide-generator.js');

    // Load main logic
    Services.scriptloader.loadSubScript(rootURI + 'src/main.js');

    Paper2Slide.init({ id, rootURI, rootDirectory: decodeURIComponent(rootURI.replace('file:///', '').replace('file://', '')) });

    // Add to existing windows
    let windows = Zotero.getMainWindows();
    for (let win of windows) {
        Paper2Slide.addToWindow(win);
    }

    // Listen for new windows
    Services.wm.addListener(windowListener);
}

function shutdown({ id, version, resourceURI, rootURI = resourceURI.spec }, reason) {
    if (Paper2Slide) {
        let windows = Zotero.getMainWindows();
        for (let win of windows) {
            Paper2Slide.removeFromWindow(win);
        }
    }
    Services.wm.removeListener(windowListener);
}

function uninstall() {
}

var windowListener = {
    onOpenWindow: function (aWindow) {
        let domWindow = aWindow.docShell.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindow);
        domWindow.addEventListener("load", function () {
            domWindow.removeEventListener("load", arguments.callee, false);
            Paper2Slide.addToWindow(domWindow);
        }, false);
    },
    onCloseWindow: function (aWindow) { },
    onWindowTitleChange: function (aWindow, aTitle) { }
};
