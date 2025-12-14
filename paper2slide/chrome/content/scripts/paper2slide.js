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

        // Create menu item for slides
        let menuitem = doc.createXULElement('menuitem');
        menuitem.id = 'paper2slide-generate';
        menuitem.setAttribute('label', 'Generate HTML Slides (LLM)');
        menuitem.setAttribute('class', 'menuitem-iconic');
        menuitem.setAttribute('image', this.rootURI + 'chrome/content/icons/icon.png');
        menuitem.addEventListener('command', () => {
            this.generateSlides(window);
        });

        // Create menu item for notes
        let noteMenuItem = doc.createXULElement('menuitem');
        noteMenuItem.id = 'paper2slide-generate-notes';
        noteMenuItem.setAttribute('label', 'Generate Markdown Notes (LLM)');
        noteMenuItem.setAttribute('class', 'menuitem-iconic');
        noteMenuItem.setAttribute('image', this.rootURI + 'chrome/content/icons/icon.png');
        noteMenuItem.addEventListener('command', () => {
            this.generateNotes(window);
        });

        // Add to item context menu
        let menu = doc.getElementById('zotero-itemmenu');
        if (menu) {
            menu.appendChild(menuitem);
            menu.appendChild(noteMenuItem);
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
        let noteMenuItem = doc.getElementById('paper2slide-generate-notes');
        if (noteMenuItem) {
            noteMenuItem.remove();
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
    },

    /**
     * Generate Markdown notes from paper
     */
    async generateNotes(window) {
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
                "(You can change settings in Zotero Settings > Paper2Slide > API Key)"
            );
            if (!key) {
                return;
            }
            this.setPref('apiKey', key);
        }

        // Show template selection dialog
        let selectedTemplate = await this.showTemplateSelector(window);
        if (!selectedTemplate) {
            return; // User cancelled
        }

        try {
            await this.processItemForNotes(pdfItem, window, selectedTemplate);
        } catch (e) {
            Zotero.debug("Paper2Slide error: " + e);
            window.alert("Error generating notes: " + e.message);
        }
    },

    /**
     * Show template selection dialog
     * @returns {object|null} Selected template info or null if cancelled
     */
    async showTemplateSelector(window) {
        // Build template list
        let templates = [];

        // Add Paper2Slide built-in template
        templates.push({
            name: "📝 Paper2Slide 内置模板",
            source: "paper2slide",
            content: Paper2SlideLLM.getPref('noteTemplate') || Paper2SlideLLM.getDefaultNoteTemplate()
        });

        // Add Better Notes templates if available
        if (typeof Zotero.BetterNotes !== 'undefined' && Zotero.BetterNotes.api?.template) {
            try {
                let bnTemplateKeys = Zotero.BetterNotes.api.template.getTemplateKeys();
                // Filter out system templates (those starting with [)
                let userTemplates = bnTemplateKeys.filter(name => !name.startsWith('['));

                for (let name of userTemplates) {
                    let content = Zotero.BetterNotes.api.template.getTemplateText(name);
                    if (content) {
                        templates.push({
                            name: "📗 " + name + " (Better Notes)",
                            source: "betternotes",
                            content: content
                        });
                    }
                }
            } catch (e) {
                Zotero.debug("Paper2Slide: Error loading Better Notes templates: " + e);
            }
        }

        // Build selection prompt
        let promptText = "选择笔记模板 / Select Note Template:\n\n";
        for (let i = 0; i < templates.length; i++) {
            promptText += `${i + 1}. ${templates[i].name}\n`;
        }
        promptText += "\n输入数字选择 (Enter number to select):";

        let choice = window.prompt(promptText, "1");
        if (!choice) {
            return null;
        }

        let index = parseInt(choice) - 1;
        if (isNaN(index) || index < 0 || index >= templates.length) {
            window.alert("无效选择 / Invalid selection");
            return null;
        }

        return templates[index];
    },

    async processItemForNotes(pdfItem, window, selectedTemplate) {
        // Progress window
        let progressWin = new Zotero.ProgressWindow({ closeOnClick: false });
        progressWin.changeHeadline("Paper2Slide - Note Generation");
        progressWin.show();

        const updateProgress = (text) => {
            progressWin.addDescription(text);
            Zotero.debug("Paper2Slide: " + text);
        };

        try {
            // 1. Extract Text
            updateProgress("Extracting text from PDF...");
            let text = await Paper2SlidePDF.getText(pdfItem);
            Zotero.debug("Paper2Slide: Extracted " + text.length + " characters");

            // 2. Get metadata from parent item
            let parentItem = pdfItem.parentItem || pdfItem;
            let metadata = {
                title: parentItem.getField('title') || 'Untitled',
                authors: '',
                journal: parentItem.getField('publicationTitle') || parentItem.getField('journalAbbreviation') || '',
                year: parentItem.getField('year') || parentItem.getField('date')?.substring(0, 4) || ''
            };

            // Get authors
            let creators = parentItem.getCreators();
            if (creators && creators.length > 0) {
                metadata.authors = creators
                    .filter(c => c.creatorType === 'author')
                    .map(c => c.lastName + (c.firstName ? ' ' + c.firstName : ''))
                    .join(', ');
            }

            // 3. Call LLM to generate notes with selected template
            updateProgress("Using template: " + selectedTemplate.name);
            updateProgress("Calling LLM API (may take 30-60s)...");
            let notesMarkdown = await Paper2SlideLLM.generateNotes(text, metadata, selectedTemplate.content);
            Zotero.debug("Paper2Slide: LLM returned " + notesMarkdown.length + " characters");

            // 4. Save notes - prefer Better Notes API if available
            if (typeof Zotero.BetterNotes !== 'undefined' && Zotero.BetterNotes.api) {
                // Better Notes is installed, create native Zotero note
                updateProgress("Creating Zotero note via Better Notes...");
                await this.createBetterNote(parentItem, notesMarkdown, metadata.title);
                updateProgress("Done! Note created in Better Notes.");
            } else {
                // Fallback: save as markdown attachment
                updateProgress("Saving notes as attachment...");
                let filename = this.sanitizeFilename(metadata.title + ' - Notes.md');
                await this.saveMarkdownAsAttachment(parentItem, notesMarkdown, filename);
                updateProgress("Done! Notes saved as attachment.");
            }
            progressWin.startCloseTimer(3000);

        } catch (e) {
            updateProgress("Error: " + e.message);
            Zotero.debug("Paper2Slide error: " + e);
            progressWin.startCloseTimer(5000);
            throw e;
        }
    },

    async saveMarkdownAsAttachment(parentItem, content, filename) {
        filename = this.sanitizeFilename(filename);

        let tmpDir = Zotero.getTempDirectory();
        let tmpFile = tmpDir.clone();
        tmpFile.append(filename);

        await Zotero.File.putContentsAsync(tmpFile, content);

        await Zotero.Attachments.importFromFile({
            file: tmpFile,
            parentItemID: parentItem.id,
            title: filename,
            contentType: 'text/markdown'
        });

        try {
            tmpFile.remove(false);
        } catch (e) {
            // Ignore cleanup errors
        }
    },

    /**
     * Create a native Zotero note using Better Notes API
     * @param {Zotero.Item} parentItem - The parent item
     * @param {string} markdown - The markdown content
     * @param {string} title - Note title
     */
    async createBetterNote(parentItem, markdown, title) {
        try {
            // Convert markdown to HTML for Zotero note
            let htmlContent = await Zotero.BetterNotes.api.convert.md2html(markdown);

            // Create new note item
            let noteItem = new Zotero.Item('note');
            noteItem.parentID = parentItem.id;
            noteItem.libraryID = parentItem.libraryID;

            // Wrap content with proper note structure
            const noteHTML = `<div data-schema-version="8">${htmlContent}</div>`;
            noteItem.setNote(noteHTML);

            await noteItem.saveTx();

            Zotero.debug("Paper2Slide: Created Better Notes note with ID " + noteItem.id);
            return noteItem;
        } catch (e) {
            Zotero.debug("Paper2Slide: Better Notes API error: " + e);
            // Fallback to simple HTML conversion
            let simpleHTML = this.markdownToSimpleHTML(markdown);

            let noteItem = new Zotero.Item('note');
            noteItem.parentID = parentItem.id;
            noteItem.libraryID = parentItem.libraryID;
            noteItem.setNote(`<div data-schema-version="8">${simpleHTML}</div>`);
            await noteItem.saveTx();

            return noteItem;
        }
    },

    /**
     * Simple markdown to HTML conversion (fallback)
     */
    markdownToSimpleHTML(markdown) {
        return markdown
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Unordered list
            .replace(/^\s*- (.*$)/gim, '<li>$1</li>')
            // Line breaks
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            // Wrap in paragraph
            .replace(/^(.*)$/, '<p>$1</p>');
    }
};
