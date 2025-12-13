var Paper2SlidePDF = {
    /**
     * Retrieves the text content of a Zotero item (PDF attachment).
     * Uses Zotero's built-in fulltext cache if available.
     * @param {Zotero.Item} item 
     * @returns {Promise<string>}
     */
    async getText(item) {
        if (!item.isAttachment() || item.attachmentContentType !== 'application/pdf') {
            throw new Error("Item is not a PDF attachment");
        }

        // Try to get indexed text first
        let text = await Zotero.Fulltext.getItemText(item.id);
        if (text) {
            return text;
        }

        // If not indexed, we might need to trigger indexing or use PDF.js
        // For this MVP, we will try to trigger indexing if possible, or fail gracefully
        // Zotero 7 might just await Zotero.Fulltext.indexItems([item])

        await Zotero.Fulltext.indexItems([item]);
        text = await Zotero.Fulltext.getItemText(item.id);

        if (!text) {
            throw new Error("Could not extract text from PDF. It may not be indexed yet.");
        }

        return text;
    }
};
