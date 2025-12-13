var Paper2SlideLLM = {
    /**
     * Call LLM API to generate slide content
     * Supports: DeepSeek, OpenAI, Gemini
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
        return {
            provider: this.getPref('provider') || 'deepseek',
            apiKey: this.getPref('apiKey') || '',
            baseUrl: this.getPref('baseUrl') || '',
            model: this.getPref('model') || '',
            prompt: this.getPref('prompt') || 'academic'
        };
    },

    // Get base URL for provider
    getBaseUrl(provider, customUrl) {
        const urls = {
            'deepseek': 'https://api.deepseek.com',
            'openai': 'https://api.openai.com',
            'gemini': 'https://generativelanguage.googleapis.com',
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
            'custom': 'llama3'
        };
        return models[provider] || 'deepseek-chat';
    },

    // Get prompt template
    getPromptTemplate(style) {
        const prompts = {
            'academic': `You are an expert at creating academic presentation slides. 
Given the following academic paper text, create a well-structured HTML presentation with 6-10 slides.

Requirements:
- First slide: Title and authors
- Include: Background, Methods, Key Results, Discussion, Conclusion
- Use bullet points for clarity
- Keep each slide focused on one main idea
- Use clear, academic language

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

            'simple': `Create a simple presentation with 5-6 slides summarizing the key points.
Use bullet points. Keep it brief and clear.
Output ONLY valid HTML using <section class="slide"> tags.`,

            'detailed': `Create a comprehensive presentation with 8-12 slides.
Include detailed explanations, examples, and supporting data.
Output ONLY valid HTML using <section class="slide"> tags.`,

            'chinese': `你是一个学术演示文稿专家。请根据以下论文内容创建一个结构清晰的HTML演示文稿，包含6-10张幻灯片。

要求：
- 第一张：标题和作者
- 包含：背景、方法、主要结果、讨论、结论
- 使用要点列表
- 每张幻灯片聚焦一个主题
- 使用清晰的中文

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
</section>`
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
        const promptTemplate = this.getPromptTemplate(config.prompt);

        Zotero.debug(`Paper2Slide: Using provider ${provider}, model ${model}`);

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
            timeout: 120000 // 2 minutes timeout
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
            timeout: 120000
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
    }
};
