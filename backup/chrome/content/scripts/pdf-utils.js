var Paper2SlidePDF = {
    /**
     * Retrieves the text content of a Zotero item (PDF attachment).
     * Uses the attachmentText property which is the correct Zotero 7 API.
     * @param {Zotero.Item} item 
     * @returns {Promise<string>}
     */
    async getText(item) {
        if (!item.isAttachment() || item.attachmentContentType !== 'application/pdf') {
            throw new Error("Item is not a PDF attachment");
        }

        Zotero.debug("Paper2Slide: Getting text for item " + item.id);

        // The correct Zotero 7 API is attachmentText
        let text = await item.attachmentText;

        if (text && text.trim().length > 100) {
            Zotero.debug("Paper2Slide: Got text via attachmentText, length: " + text.length);
            return text;
        }

        // If no text, try to reindex
        Zotero.debug("Paper2Slide: No text found, attempting reindex...");
        await Zotero.Fulltext.indexItems([item.id], { complete: true });

        // Wait for indexing
        await Zotero.Promise.delay(2000);

        // Try again
        text = await item.attachmentText;

        if (text && text.trim().length > 100) {
            Zotero.debug("Paper2Slide: Got text after reindex, length: " + text.length);
            return text;
        }

        throw new Error("Could not extract text. Please ensure the PDF is text-based (not scanned images). Try: right-click PDF → 重建条目索引");
    }
};
