var Paper2Slide = {
    id: null,
    version: null,
    rootURI: null,

    init({ id, version, rootURI }) {
        this.id = id;
        this.version = version;
        this.rootURI = rootURI;
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
        menuitem.setAttribute('label', 'Generate HTML Slides');
        menuitem.setAttribute('class', 'menuitem-iconic');
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

        try {
            // Progress window
            let progressWin = new Zotero.ProgressWindow({ closeOnClick: true });
            progressWin.changeHeadline("Paper2Slide");
            let itemProgress = new progressWin.ItemProgress(null, "Generating slides...");
            progressWin.show();

            // Extract text
            itemProgress.setText("Extracting text from PDF...");
            let text = await Paper2SlidePDF.getText(pdfItem);

            // Summarize
            itemProgress.setText("Creating slide content...");
            let slides = await Paper2SlideSummarizer.summarize(text);

            // Generate HTML
            itemProgress.setText("Building HTML slides...");
            let parentItem = pdfItem.parentItem || pdfItem;
            let title = parentItem.getField('title') || 'Untitled';
            let html = Paper2SlideGenerator.generateHTML(slides, title);

            // Save
            itemProgress.setText("Saving attachment...");
            await this.saveAsAttachment(parentItem, html, title + " - Slides.html");

            itemProgress.setProgress(100);
            itemProgress.setText("Done!");
            progressWin.startCloseTimer(2000);

        } catch (e) {
            Zotero.debug("Paper2Slide error: " + e);
            window.alert("Error generating slides: " + e.message);
        }
    },

    async saveAsAttachment(parentItem, htmlContent, filename) {
        // Sanitize filename - remove illegal characters for Windows
        filename = this.sanitizeFilename(filename);

        // Create temp file
        let tmpDir = Zotero.getTempDirectory();
        let tmpFile = tmpDir.clone();
        tmpFile.append(filename);

        await Zotero.File.putContentsAsync(tmpFile, htmlContent);

        // Import as attachment
        await Zotero.Attachments.importFromFile({
            file: tmpFile,
            parentItemID: parentItem.id,
            title: filename,
            contentType: 'text/html'
        });

        // Clean up
        tmpFile.remove(false);
    },

    sanitizeFilename(filename) {
        // Remove characters not allowed in Windows filenames: \ / : * ? " < > |
        return filename
            .replace(/[\\/:*?"<>|]/g, '-')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 200); // Limit length
    }
};
