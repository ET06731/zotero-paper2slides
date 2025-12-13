var Paper2SlideGenerator = {
    /**
     * Generates a standalone HTML string for the slides.
     * @param {Array<{title: string, content: string}>} slides 
     * @returns {string}
     */
    generateHTML(slides) {
        const slideItems = slides.map(s => `
            <section class="slide">
                <h2>${s.title}</h2>
                <div class="content">${s.content}</div>
            </section>
        `).join('\n');

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Paper2Slide Presentation</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f0f0f0;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .slide {
            background: white;
            width: 800px;
            height: 450px;
            margin: 20px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        h2 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        .content {
            font-size: 1.2em;
            line-height: 1.6;
            color: #555;
        }
        @media print {
            body { background: none; }
            .slide { box-shadow: none; page-break-after: always; margin: 0; border: none; }
        }
    </style>
</head>
<body>
    ${slideItems}
</body>
</html>`;
    }
};
