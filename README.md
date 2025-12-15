# Paper2Slide

🎯 **Zotero 7 Plugin** - Automatically convert academic paper PDFs to HTML slides and structured notes using LLM

![Zotero 7](https://img.shields.io/badge/Zotero-7.0-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Features

### 🎯 Core Features

| Feature | Description |
|---------|-------------|
| **PDF → HTML Slides** | Extract text from PDFs and generate presentation-ready HTML slides via LLM |
| **PDF → Notes** | Generate structured Markdown notes with customizable templates |
| **PDF Export** | Export slides to PDF via system print dialog |
| **Better Notes Integration** | Create native Zotero notes with Better Notes plugin support |


### ⚙️ Rich Customization

| Category | Options |
|----------|---------|
| **Output Language** | Chinese / English |
| **Prompt Presets** | Academic / Simple / Detailed |
| **Slide Themes** | Modern Gradient / Minimal White / Dark / Academic |
| **Export Format** | HTML only / HTML + PDF |
| **Note Templates** | Fully customizable with Markdown and placeholders (`{{title}}`, `{{authors}}`, `{{journal}}`, `{{year}}`) |

## 📦 Installation

### Method: Install XPI File

1. Download the latest `.xpi` file
2. Open Zotero → Tools → Add-ons
3. Drag and drop the `.xpi` file into the window

## 🚀 Usage

### 1. Configure API

Open **Zotero Preferences → Paper2Slide** and configure:

| Setting | Description |
|---------|-------------|
| API Provider | Choose DeepSeek / Kimi / Doubao / Zhipu / OpenAI / Gemini / Custom |
| API Key | Enter the API key for your chosen provider |
| Model Name | (Optional) Specify a model, or leave blank for default |
| Custom Base URL | For self-hosted models like Ollama |

### 2. Generate Slides

1. Select a paper with a PDF attachment in Zotero
2. **Right-click → Generate Slides**
3. Wait 30-60 seconds (depends on paper length and network speed)
4. The generated HTML file will be automatically saved as an attachment

### 3. Generate Notes

1. Select a paper with a PDF attachment
2. **Right-click → Generate Notes**
3. Choose a template (default or custom)
4. Notes will be saved as Markdown attachment or Zotero note

## 🔧 Supported LLM Providers

| Provider | Default Model | API Endpoint |
|----------|---------------|--------------|
| DeepSeek | deepseek-chat | api.deepseek.com |
| Kimi (Moonshot AI) | moonshot-v1-8k | api.moonshot.cn |
| Doubao (ByteDance) | doubao-pro-4k | ark.cn-beijing.volces.com |
| Zhipu GLM | glm-4-flash | open.bigmodel.cn |
| SiliconFlow | deepseek-ai/DeepSeek-V3.2 | api.siliconflow.cn |
| Open Router | deepseek-ai/DeepSeek-V3.2 | openrouter.ai/api |
| OpenAI | gpt-4o-mini | api.openai.com |
| Google Gemini | gemini-1.5-flash | generativelanguage.googleapis.com |
| Custom | Configurable | Configurable (supports Ollama, etc.) |

## 📁 Project Structure

```
paper2slide/
├── manifest.json           # Plugin manifest
├── bootstrap.js            # Entry point
├── prefs.js               # Default preferences
└── chrome/
    └── content/
        ├── preferences.xhtml  # Settings UI
        ├── icons/
        │   └── icon.png       # Plugin icon
        └── scripts/
            ├── paper2slide.js     # Main logic
            ├── llm-service.js     # LLM API calls
            ├── pdf-utils.js       # PDF text extraction
            ├── slide-generator.js # HTML generation
            ├── summarizer.js      # Backup summarizer
            └── preferences.js     # Settings handler
```

## ❓ FAQ

### Q: Shows "Could not extract text"
**A:** Make sure the PDF contains selectable text (not a scanned image). Try right-clicking the PDF → Rebuild Index.

### Q: Request timeout
**A:** 
- Current timeout is set to 5 minutes
- Try selecting the "Simple" preset to reduce generated content
- Check your network connection

### Q: Generated content is in the wrong language
**A:** Change the "Output Language" setting to your preferred language in preferences.

### Q: How to use custom/local models?
**A:** Select "Custom (OpenAI Compatible)" as provider, set Base URL (e.g., `http://localhost:11434` for Ollama), and specify the model name.

## 📄 License

MIT License

## 🙏 Acknowledgements

- [Zotero](https://www.zotero.org/) - Excellent reference management tool
- All LLM providers for their API services
