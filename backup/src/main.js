var Paper2Slide = {
    id: null,

    init({ id, rootURI, rootDirectory }) {
        this.id = id;
        this.rootURI = rootURI;
        this.rootDirectory = rootDirectory;
        Zotero.debug("Paper2Slide: Initialized");
    },

    addToWindow(window) {
        let doc = window.document;

        // Add context menu item
        let popup = doc.getElementById('zotero-itemmenu');
        if (popup) {
            let menuitem = doc.createXULElement ? doc.createXULElement('menuitem') : doc.createElement('menuitem');
            menuitem.setAttribute('id', 'paper2slide-generate-slides');
            menuitem.setAttribute('label', 'Generate HTML Slides');
            menuitem.setAttribute('class', 'menuitem-iconic');
            // menuitem.setAttribute('image', this.rootURI + 'icons/icon.png'); // If we had one

            menuitem.addEventListener('command', () => {
                this.generateSlidesForSelection();
            });

            popup.appendChild(menuitem);

            // Store reference to clean up later
            window.paper2slideMenuItem = menuitem;
        }
    },

    removeFromWindow(window) {
        if (window.paper2slideMenuItem) {
            window.paper2slideMenuItem.remove();
            delete window.paper2slideMenuItem;
        }
    },

    async generateSlidesForSelection() {
        let items = Zotero.getActiveZoteroPane().getSelectedItems();
        if (items.length !== 1) {
            return;
        }

        let item = items[0];

        // If parent is selected, try to find PDF
        if (!item.isAttachment()) {
            let attachment = await item.getBestAttachment();
            if (attachment && attachment.attachmentContentType === 'application/pdf') {
                item = attachment;
            } else {
                alert("Please select a PDF attachment.");
                return;
            }
        } else if (item.attachmentContentType !== 'application/pdf') {
            alert("Selected item is not a PDF.");
            return;
        }

        try {
            await this.processItem(item);
        } catch (e) {
            Zotero.debug(e);
            alert("Error generating slides: " + e.message);
        }
    },

    async processItem(item) {
        // Show progress (simple way)
        let progressWin = new Zotero.ProgressWindow({ closeOnClick: true });
        progressWin.changeHeadline("Generating Slides...");
        progressWin.show();
        let probressLabel = progressWin.addDescription("Extracting text...");

        try {
            // 1. Extract Text
            let text = await Paper2SlidePDF.getText(item);

            // 2. Summarize
            probressLabel.setText("Summarizing content...");
            let slides = await Paper2SlideSummarizer.summarize(text);

            // 3. Generate HTML
            probressLabel.setText("Building slides...");
            let html = Paper2SlideGenerator.generateHTML(slides);

            // 4. Save as new attachment
            probressLabel.setText("Saving attachment...");
            await this.saveSlides(item.parentID, html, item.getField('title').replace('.pdf', '') + ' - Slides.html');

            probressLabel.setText("Done!");
            progressWin.startCloseTimer(2000);

        } catch (e) {
            probressLabel.setText("Error: " + e.message);
            Zotero.debug(e);
        }
    },

    async saveSlides(parentID, html, filename) {
        let item = new Zotero.Item('attachment');
        item.parentID = parentID;
        item.setField('title', filename);
        item.setField('linkMode', 'imported_file');
        item.setField('contentType', 'text/html');
        await item.saveTx();

        await Zotero.Attachments.importFromData({
            libraryID: item.libraryID,
            item: item,
            data: html,
            filename: filename
        });
    }
};
