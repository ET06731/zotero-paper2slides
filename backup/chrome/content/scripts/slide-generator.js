var Paper2SlideGenerator = {
    /**
     * Generates a standalone HTML string for the slides.
     * @param {Array<{title: string, content: string}>} slides 
     * @param {string} documentTitle
     * @returns {string}
     */
    generateHTML(slides, documentTitle) {
        const slideItems = slides.map((s, i) => `
            <section class="slide" id="slide-${i}">
                <h2>${this.escapeHtml(s.title)}</h2>
                <div class="content">${this.escapeHtml(s.content)}</div>
            </section>
        `).join('\n');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(documentTitle)} - Slides</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        .slide {
            background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
            width: min(900px, 95vw);
            aspect-ratio: 16/9;
            margin: 30px auto;
            padding: 60px;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 8px 20px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }
        .slide::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 6px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
        }
        h2 {
            color: #2d3748;
            font-size: 2.2em;
            font-weight: 700;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 3px solid #667eea;
        }
        .content {
            font-size: 1.3em;
            line-height: 1.8;
            color: #4a5568;
        }
        @media print {
            body { background: white; padding: 0; }
            .slide { 
                box-shadow: none; 
                page-break-after: always; 
                margin: 0; 
                border: 1px solid #ddd;
                border-radius: 0;
            }
            .slide::before { display: none; }
        }
        @media (max-width: 768px) {
            .slide { padding: 30px; }
            h2 { font-size: 1.5em; }
            .content { font-size: 1em; }
        }
    </style>
</head>
<body>
${slideItems}
</body>
</html>`;
    },

    escapeHtml(text) {
        const div = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, s => div[s]);
    }
};
