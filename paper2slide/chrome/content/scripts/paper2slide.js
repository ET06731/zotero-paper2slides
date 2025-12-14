var Paper2Slide = {
    id: null,
    rootURI: null,

    // Preference helpers
    getPref(key) {
        return Zotero.Prefs.get('extensions.paper2slide.' + key, true);
    },

    setPref(key, value) {
        Zotero.Prefs.set('extensions.paper2slide.' + key, value, true);
    },

    init({ id, version, rootURI }) {
        this.id = id;
        this.version = version;
        this.rootURI = rootURI;

        // Set default preferences if not set
        if (!this.getPref('provider')) {
            this.setPref('provider', 'deepseek');
        }
        if (!this.getPref('prompt')) {
            this.setPref('prompt', 'academic');
        }
        if (!this.getPref('style')) {
            this.setPref('style', 'modern');
        }

        Zotero.debug("Paper2Slide: Initialized");
    },

    addToAllWindows() {
        var windows = Zotero.getMainWindows();
        for (let win of windows) {
            if (!win.ZoteroPane) continue;
            this.addToWindow(win);
        }
    },

    addToWindow(window) {
        let doc = window.document;

        // Create menu item
        let menuitem = doc.createXULElement('menuitem');
        menuitem.id = 'paper2slide-generate';
        menuitem.setAttribute('label', 'Generate HTML Slides (LLM)');
        menuitem.setAttribute('class', 'menuitem-iconic');
        menuitem.setAttribute('image', this.rootURI + 'chrome/content/icons/icon.png');
        menuitem.addEventListener('command', () => {
            this.generateSlides(window);
        });

        // Add to item context menu
        let menu = doc.getElementById('zotero-itemmenu');
        if (menu) {
            menu.appendChild(menuitem);
        }
    },

    removeFromAllWindows() {
        var windows = Zotero.getMainWindows();
        for (let win of windows) {
            if (!win.ZoteroPane) continue;
            this.removeFromWindow(win);
        }
    },

    removeFromWindow(window) {
        let doc = window.document;
        let menuitem = doc.getElementById('paper2slide-generate');
        if (menuitem) {
            menuitem.remove();
        }
    },

    async generateSlides(window) {
        let items = window.ZoteroPane.getSelectedItems();
        if (items.length !== 1) {
            window.alert("Please select exactly one item.");
            return;
        }

        let item = items[0];
        let pdfItem = null;

        // Find PDF
        if (item.isAttachment() && item.attachmentContentType === 'application/pdf') {
            pdfItem = item;
        } else if (item.isRegularItem()) {
            let attachments = await item.getAttachments();
            for (let attId of attachments) {
                let att = await Zotero.Items.getAsync(attId);
                if (att && att.attachmentContentType === 'application/pdf') {
                    pdfItem = att;
                    break;
                }
            }
        }

        if (!pdfItem) {
            window.alert("No PDF attachment found for this item.");
            return;
        }

        // Check API key
        let apiKey = this.getPref('apiKey');
        if (!apiKey) {
            let key = window.prompt(
                "Please enter your API Key:\n\n" +
                "Provider: " + (this.getPref('provider') || 'deepseek') + "\n" +
                "(You can change settings in about:Zotero Settings > Paper2Slide > API Key)"
            );
            if (!key) {
                return;
            }
            this.setPref('apiKey', key);
        }

        try {
            await this.processItemWithLLM(pdfItem, window);
        } catch (e) {
            Zotero.debug("Paper2Slide error: " + e);
            window.alert("Error generating slides: " + e.message);
        }
    },

    async processItemWithLLM(pdfItem, window) {
        // Simple progress window using Zotero's popup
        let progressWin = new Zotero.ProgressWindow({ closeOnClick: false });
        progressWin.changeHeadline("Paper2Slide - LLM Generation");
        progressWin.show();

        // Helper to update progress text
        const updateProgress = (text) => {
            progressWin.addDescription(text);
            Zotero.debug("Paper2Slide: " + text);
        };

        try {
            // 1. Extract Text
            updateProgress("Extracting text from PDF...");
            let text = await Paper2SlidePDF.getText(pdfItem);
            Zotero.debug("Paper2Slide: Extracted " + text.length + " characters");

            // 2. Call LLM to generate slides
            updateProgress("Calling LLM API (may take 30-60s)...");
            let slidesHTML = await Paper2SlideLLM.generateSlides(text);
            Zotero.debug("Paper2Slide: LLM returned " + slidesHTML.length + " characters");

            // 3. Wrap with full HTML document
            updateProgress("Building final HTML...");
            let parentItem = pdfItem.parentItem || pdfItem;
            let title = parentItem.getField('title') || 'Untitled';
            let style = this.getPref('style') || 'modern';
            let fullHTML = Paper2SlideGenerator.wrapHTML(slidesHTML, title, style);

            // 4. Save as attachment
            updateProgress("Saving attachment...");
            let filename = this.sanitizeFilename(title + ' - Slides.html');
            await this.saveAsAttachment(parentItem, fullHTML, filename);

            updateProgress("Done! Slides generated successfully.");
            progressWin.startCloseTimer(3000);

        } catch (e) {
            updateProgress("Error: " + e.message);
            Zotero.debug("Paper2Slide error: " + e);
            progressWin.startCloseTimer(5000);
            throw e;
        }
    },

    sanitizeFilename(filename) {
        return filename
            .replace(/[\\/:*?"<>|]/g, '-')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 200);
    },

    async saveAsAttachment(parentItem, htmlContent, filename) {
        filename = this.sanitizeFilename(filename);

        let tmpDir = Zotero.getTempDirectory();
        let tmpFile = tmpDir.clone();
        tmpFile.append(filename);

        await Zotero.File.putContentsAsync(tmpFile, htmlContent);

        await Zotero.Attachments.importFromFile({
            file: tmpFile,
            parentItemID: parentItem.id,
            title: filename,
            contentType: 'text/html'
        });

        try {
            tmpFile.remove(false);
        } catch (e) {
            // Ignore cleanup errors
        }
    }
};
