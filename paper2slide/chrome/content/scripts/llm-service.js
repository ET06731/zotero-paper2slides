var Paper2SlideLLM = {
    /**
     * Call LLM API to generate slide content
     * Supports: DeepSeek, OpenAI, Gemini, SiliconFlow, OpenRouter
     */

    // Get preference value
    getPref(key) {
        return Zotero.Prefs.get('extensions.paper2slide.' + key, true);
    },

    // Set preference value
    setPref(key, value) {
        Zotero.Prefs.set('extensions.paper2slide.' + key, value, true);
    },

    // Get current provider config
    getConfig() {
        const provider = this.getPref('provider') || 'deepseek';
        return {
            provider: provider,
            apiKey: this.getPref('apiKey.' + provider) || '',
            baseUrl: this.getPref('baseUrl') || '',
            model: this.getPref('model.' + provider) || '',
            language: this.getPref('language') || 'chinese',
            prompt: this.getPref('prompt') || 'academic'
        };
    },

    // Get base URL for provider
    getBaseUrl(provider, customUrl) {
        const urls = {
            'deepseek': 'https://api.deepseek.com',
            'openai': 'https://api.openai.com',
            'gemini': 'https://generativelanguage.googleapis.com',
            'kimi': 'https://api.moonshot.cn',
            'doubao': 'https://ark.cn-beijing.volces.com/api',
            'zhipu': 'https://open.bigmodel.cn/api/paas',
            'siliconflow': 'https://api.siliconflow.cn',
            'openrouter': 'https://openrouter.ai/api',
            'custom': customUrl || 'http://localhost:11434'
        };
        return urls[provider] || urls['deepseek'];
    },

    // Get default model for provider
    getDefaultModel(provider) {
        const models = {
            'deepseek': 'deepseek-chat',
            'openai': 'gpt-4o-mini',
            'gemini': 'gemini-1.5-flash',
            'kimi': 'moonshot-v1-8k',
            'doubao': 'doubao-pro-4k',
            'zhipu': 'glm-4-flash',
            'siliconflow': 'deepseek-ai/DeepSeek-V3.2',
            'openrouter': 'deepseek-ai/DeepSeek-V3.2',
            'custom': 'llama3'
        };
        return models[provider] || 'deepseek-chat';
    },

    // Get prompt template based on style and language
    getPromptTemplate(style, language) {
        const isChinese = language === 'chinese';

        const prompts = {
            'academic': isChinese ?
                `你是一个学术演示文稿专家。请根据以下论文内容创建一个结构清晰的HTML演示文稿，包含6-10张幻灯片。

要求：
- 第一张：标题和作者（作者只保留3-5人，超出用"等"代替，作者名必须在同一行）
- 包含：背景/动机、方法、主要结果、讨论、结论
- 使用要点列表，每个要点简洁明了
- 每张幻灯片聚焦一个主题
- 使用清晰的中文

幻灯片规格：
- 宽高比例：16:9（标准PPT宽屏比例）
- 推荐尺寸：1280px × 720px
- 每张幻灯片内容适量，留有足够空白

格式要求：
- 标题页作者格式示例：张三, 李四, 王五 等
- 每个要点不超过两行

只输出有效的HTML代码，不要markdown，不要解释。
使用以下结构：
<section class="slide">
  <h2>幻灯片标题</h2>
  <div class="content">
    <ul>
      <li>要点1</li>
      <li>要点2</li>
    </ul>
  </div>
</section>` :
                `You are an expert at creating academic presentation slides. 
Given the following academic paper text, create a well-structured HTML presentation with 6-10 slides.

Requirements:
- First slide: Title and authors (keep only 3-5 authors on ONE line, use "et al." for additional authors)
- Include: Background/Motivation, Methods, Key Results, Discussion, Conclusion
- Use bullet points for clarity, keep each point concise
- Keep each slide focused on one main idea
- Use clear, academic language

Slide Specifications:
- Aspect ratio: 16:9 (standard widescreen PPT ratio)
- Recommended dimensions: 1280px × 720px
- Keep content balanced with adequate white space on each slide

Formatting:
- Author line example: John Smith, Jane Doe, Bob Wilson et al.
- Each bullet point should be no more than 2 lines

Output ONLY valid HTML code for the slides, no markdown, no explanations.
Use this exact structure for each slide:
<section class="slide">
  <h2>Slide Title</h2>
  <div class="content">
    <ul>
      <li>Point 1</li>
      <li>Point 2</li>
    </ul>
  </div>
</section>`,

            'simple': isChinese ?
                `创建一个简洁的演示文稿，包含5-6张幻灯片，总结关键要点。
使用要点列表。保持简短清晰。使用中文。
只输出有效的HTML，使用 <section class="slide"> 标签。` :
                `Create a simple presentation with 5-6 slides summarizing the key points.
Use bullet points. Keep it brief and clear.
Output ONLY valid HTML using <section class="slide"> tags.`,

            'detailed': isChinese ?
                `创建一个详细的演示文稿，包含8-12张幻灯片。
包含详细解释、示例和支持数据。使用中文。
只输出有效的HTML，使用 <section class="slide"> 标签。` :
                `Create a comprehensive presentation with 8-12 slides.
Include detailed explanations, examples, and supporting data.
Output ONLY valid HTML using <section class="slide"> tags.`
        };
        return prompts[style] || prompts['academic'];
    },

    /**
     * Call LLM API
     * @param {string} paperText - The paper text to summarize
     * @returns {Promise<string>} - HTML slides content
     */
    async generateSlides(paperText) {
        const config = this.getConfig();

        if (!config.apiKey) {
            throw new Error('API Key not configured. Please set it in Zotero Preferences > Paper2Slide');
        }

        const provider = config.provider;
        const baseUrl = config.baseUrl || this.getBaseUrl(provider);
        const model = config.model || this.getDefaultModel(provider);
        const promptTemplate = this.getPromptTemplate(config.prompt, config.language);

        Zotero.debug(`Paper2Slide: Using provider ${provider}, model ${model}, language ${config.language}`);

        // Truncate paper text if too long (keep first ~15000 chars)
        const maxLength = 15000;
        const truncatedText = paperText.length > maxLength
            ? paperText.substring(0, maxLength) + '\n\n[... text truncated ...]'
            : paperText;

        const fullPrompt = promptTemplate + '\n\n---\n\nPaper text:\n\n' + truncatedText;

        if (provider === 'gemini') {
            return await this.callGeminiAPI(baseUrl, config.apiKey, model, fullPrompt);
        } else {
            // OpenAI-compatible API (DeepSeek, OpenAI, Custom)
            return await this.callOpenAICompatibleAPI(baseUrl, config.apiKey, model, fullPrompt);
        }
    },

    /**
     * Call OpenAI-compatible API (DeepSeek, OpenAI, Ollama, etc.)
     */
    async callOpenAICompatibleAPI(baseUrl, apiKey, model, prompt) {
        const url = baseUrl + '/v1/chat/completions';

        const body = JSON.stringify({
            model: model,
            messages: [
                { role: 'user', content: prompt }
            ],
            max_tokens: 4000,
            temperature: 0.7
        });

        Zotero.debug('Paper2Slide: Calling ' + url);

        let response = await Zotero.HTTP.request('POST', url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: body,
            timeout: 300000 // 5 minutes timeout
        });

        if (response.status !== 200) {
            throw new Error(`API error: ${response.status} - ${response.responseText}`);
        }

        let data = JSON.parse(response.responseText);
        let content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('No content in API response');
        }

        return this.extractHTML(content);
    },

    /**
     * Call Google Gemini API
     */
    async callGeminiAPI(baseUrl, apiKey, model, prompt) {
        const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const body = JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                maxOutputTokens: 4000,
                temperature: 0.7
            }
        });

        Zotero.debug('Paper2Slide: Calling Gemini API');

        let response = await Zotero.HTTP.request('POST', url, {
            headers: {
                'Content-Type': 'application/json'
            },
            body: body,
            timeout: 300000 // 5 minutes timeout
        });

        if (response.status !== 200) {
            throw new Error(`Gemini API error: ${response.status} - ${response.responseText}`);
        }

        let data = JSON.parse(response.responseText);
        let content = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
            throw new Error('No content in Gemini response');
        }

        return this.extractHTML(content);
    },

    /**
     * Extract HTML from LLM response (remove markdown code blocks if present)
     */
    extractHTML(content) {
        // Remove markdown code blocks
        content = content.replace(/```html\n?/gi, '').replace(/```\n?/g, '');

        // Ensure we have valid slide sections
        if (!content.includes('<section')) {
            // Wrap in a section if not present
            content = '<section class="slide"><div class="content">' + content + '</div></section>';
        }

        return content.trim();
    },

    /**
     * Get default note template
     */
    getDefaultNoteTemplate() {
        return `# {{title}}

## 基本信息
- **作者**: {{authors}}
- **期刊**: {{journal}}
- **年份**: {{year}}

## 研究背景
(论文解决的问题和研究动机)

## 研究方法
(主要方法和技术路线)

## 主要结果
(关键发现和结论)

## 个人笔记
(你的理解和想法)`;
    },

    /**
     * Get note generation prompt
     */
    getNotePromptTemplate(noteTemplate, language) {
        const isChinese = language === 'chinese';

        const basePrompt = isChinese ?
            `你是一个学术论文阅读助手。请根据以下论文内容，按照用户提供的 Markdown 模板格式生成读书笔记。

要求：
1. 严格按照模板的结构和格式输出
2. 用论文中的实际内容填充模板中的各个部分
3. 占位符 {{title}}, {{authors}}, {{journal}}, {{year}} 应该用论文的实际信息替换
4. 其他部分根据论文内容进行总结和提炼
5. 保持 Markdown 格式，确保输出可以直接保存为 .md 文件
6. 使用清晰简洁的中文

只输出 Markdown 内容，不要添加额外的解释或说明。` :
            `You are an academic paper reading assistant. Generate reading notes based on the provided paper content, following the user's Markdown template format.

Requirements:
1. Strictly follow the template structure and format
2. Fill in each section with actual content from the paper
3. Replace placeholders {{title}}, {{authors}}, {{journal}}, {{year}} with actual paper information
4. Summarize and extract key points for other sections based on paper content
5. Maintain Markdown format, ensure output can be saved directly as .md file
6. Use clear and concise language

Output ONLY the Markdown content, no additional explanations.`;

        return basePrompt + '\n\n---\n\n用户笔记模板 (Note Template):\n\n' + noteTemplate;
    },

    /**
     * Extract Markdown from LLM response (remove code blocks if present)
     */
    extractMarkdown(content) {
        // Remove markdown code blocks
        content = content.replace(/```markdown\n?/gi, '').replace(/```md\n?/gi, '').replace(/```\n?/g, '');
        return content.trim();
    },

    /**
     * Generate notes from paper using LLM
     * @param {string} paperText - The paper text
     * @param {object} metadata - Paper metadata (title, authors, journal, year)
     * @param {string} templateContent - Optional template content (from Better Notes or Paper2Slide settings)
     * @returns {Promise<string>} - Markdown notes content
     */
    async generateNotes(paperText, metadata = {}, templateContent = null) {
        const config = this.getConfig();

        if (!config.apiKey) {
            throw new Error('API Key not configured. Please set it in Zotero Preferences > Paper2Slide');
        }

        const provider = config.provider;
        const baseUrl = config.baseUrl || this.getBaseUrl(provider);
        const model = config.model || this.getDefaultModel(provider);

        // Use provided template or fall back to preferences/default
        let noteTemplate = templateContent || this.getPref('noteTemplate') || this.getDefaultNoteTemplate();

        // Pre-fill metadata placeholders if available
        if (metadata.title) noteTemplate = noteTemplate.replace(/\{\{title\}\}/g, metadata.title);
        if (metadata.authors) noteTemplate = noteTemplate.replace(/\{\{authors\}\}/g, metadata.authors);
        if (metadata.journal) noteTemplate = noteTemplate.replace(/\{\{journal\}\}/g, metadata.journal);
        if (metadata.year) noteTemplate = noteTemplate.replace(/\{\{year\}\}/g, metadata.year);

        const promptTemplate = this.getNotePromptTemplate(noteTemplate, config.language);

        Zotero.debug(`Paper2Slide: Generating notes with provider ${provider}, model ${model}`);

        // Truncate paper text if too long
        const maxLength = 15000;
        const truncatedText = paperText.length > maxLength
            ? paperText.substring(0, maxLength) + '\n\n[... text truncated ...]'
            : paperText;

        const fullPrompt = promptTemplate + '\n\n---\n\nPaper text:\n\n' + truncatedText;

        let result;
        if (provider === 'gemini') {
            result = await this.callGeminiAPI(baseUrl, config.apiKey, model, fullPrompt);
        } else {
            result = await this.callOpenAICompatibleAPI(baseUrl, config.apiKey, model, fullPrompt);
        }

        return this.extractMarkdown(result);
    }
};
