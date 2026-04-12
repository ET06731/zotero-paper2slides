# Paper2Slide

🎯 **Zotero 7 / 8 插件** - 使用 LLM 将学术论文 PDF 自动转换为 HTML 幻灯片和结构化笔记

![Zotero](https://img.shields.io/badge/Zotero-7%20%7C%208-green)
![License](https://img.shields.io/badge/License-MIT-blue)

[English](README-en.md) | 简体中文

## ✨ 功能特性

### 🎯 核心功能

| 功能 | 说明 |
|------|------|
| **PDF → HTML 幻灯片** | 从 PDF 提取文本，通过 LLM 生成演示文稿 HTML |
| **PDF → 笔记** | 生成结构化 Markdown 笔记，支持自定义模板 |
| **PDF 导出** | 通过系统打印对话框导出 PDF |
| **Better Notes 集成** | 支持创建原生 Zotero 笔记 (需安装 Better Notes 插件) |


### ⚙️ 丰富的自定义选项

| 类别 | 选项 |
|------|------|
| **输出语言** | 中文 / English |
| **Prompt 预设** | 学术风格 / 简洁版 / 详细版 |
| **幻灯片样式** | 现代渐变 / 极简白 / 暗色主题 / 学术风格 |
| **导出格式** | 仅 HTML / HTML + PDF |
| **笔记模板** | 完全自定义，支持 Markdown 和占位符 (`{{title}}`, `{{authors}}`, `{{journal}}`, `{{year}}`) |

## 📦 安装

### 方法: 安装 XPI 文件

1. 下载最新的 `.xpi` 文件
2. 打开 Zotero → 工具 → 插件
3. 拖放 `.xpi` 文件到窗口中

## 🚀 使用方法

### 1. 配置 API

打开 **Zotero 设置 → Paper2Slide**，配置：

| 设置项 | 说明 |
|--------|------|
| API 提供商 | 选择 DeepSeek / Kimi / 豆包 / 智谱 / OpenAI / Gemini / 自定义 |
| API Key | 填入对应平台的 API 密钥 |
| 模型名称 | (可选) 指定模型，留空使用默认模型 |
| 自定义 Base URL | 用于自托管模型如 Ollama |

### 2. 生成幻灯片

1. 在 Zotero 中选择一篇带有 PDF 附件的论文
2. **右键点击 → Generate Slides**
3. 等待 30-60 秒（取决于论文长度和网络速度）
4. 生成的 HTML 文件会自动保存为该条目的附件

### 3. 生成笔记

1. 选择一篇带有 PDF 附件的论文
2. **右键点击 → Generate Notes**
3. 选择模板（默认模板或自定义模板）
4. 笔记将保存为 Markdown 附件或 Zotero 笔记

## 🔧 支持的 LLM 提供商

| 提供商 | 默认模型 | API 地址 |
|--------|----------|----------|
| DeepSeek | deepseek-chat | api.deepseek.com |
| Kimi (月之暗面) | moonshot-v1-8k | api.moonshot.cn |
| 豆包 (字节跳动) | doubao-pro-4k | ark.cn-beijing.volces.com |
| 智谱 GLM | glm-4-flash | open.bigmodel.cn |
| 硅基流动 (SiliconFlow) | deepseek-ai/DeepSeek-V3.2 | api.siliconflow.cn |
| Open Router | deepseek-ai/DeepSeek-V3.2 | openrouter.ai/api |
| OpenAI | gpt-4o-mini | api.openai.com |
| Google Gemini | gemini-1.5-flash | generativelanguage.googleapis.com |
| 自定义 | 可配置 | 可配置 (支持 Ollama 等) |

## 📁 项目结构

```
paper2slide/
├── manifest.json           # 插件清单
├── bootstrap.js            # 入口文件
├── prefs.js               # 默认偏好设置
└── chrome/
    └── content/
        ├── preferences.xhtml  # 设置界面
        ├── icons/
        │   └── icon.png       # 插件图标
        └── scripts/
            ├── paper2slide.js     # 主逻辑
            ├── llm-service.js     # LLM API 调用
            ├── pdf-utils.js       # PDF 文本提取
            ├── slide-generator.js # HTML 生成
            ├── summarizer.js      # 备用摘要器
            └── preferences.js     # 设置处理
```

## ❓ 常见问题

### Q: 提示 "Could not extract text"
**A:** 确保 PDF 是文字版（非扫描版）。尝试右键 PDF → 重建条目索引。

### Q: 请求超时
**A:** 
- 当前超时设置为 5 分钟
- 尝试选择 "简洁版 (Simple)" 预设减少生成内容
- 检查网络连接

### Q: 生成内容是英文
**A:** 在设置中将 "输出语言" 改为 "中文 (Chinese)"。

### Q: 如何使用自定义/本地模型？
**A:** 选择 "自定义 (OpenAI 兼容)" 作为提供商，设置 Base URL (如 Ollama 使用 `http://localhost:11434`)，并指定模型名称。

## 📄 License

MIT License

## 🙏 致谢

- [Zotero](https://www.zotero.org/) - 优秀的文献管理工具
- 各 LLM 提供商提供的 API 服务
