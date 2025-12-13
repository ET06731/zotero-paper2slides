var Paper2SlideSummarizer = {
    /**
     * Summarizes the text content into slide-sized chunks.
     * This is a fallback when LLM is not available.
     * @param {string} text 
     * @returns {Promise<Array<{title: string, content: string}>>}
     */
    async summarize(text) {
        // Split by paragraphs and filter short ones
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 100);
        const slides = [];

        // Title Slide (标题幻灯片)
        slides.push({
            title: "摘要",
            content: "由 Paper2Slide 自动生成"
        });

        // Generate content slides (max 6) (内容幻灯片)
        const count = Math.min(paragraphs.length, 6);
        const sectionNames = ["背景介绍", "研究方法", "主要结果", "分析讨论", "关键发现", "补充说明"];

        for (let i = 0; i < count; i++) {
            const para = paragraphs[i].trim();
            slides.push({
                title: sectionNames[i] || `要点 ${i + 1}`,
                content: para.substring(0, 400) + (para.length > 400 ? "..." : "")
            });
        }

        // Conclusion slide (结论幻灯片)
        slides.push({
            title: "总结",
            content: "感谢阅读！"
        });

        return slides;
    }
};
