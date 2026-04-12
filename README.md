# Paper2Slide

🎯 **Zotero 7 / 8 插件** - 使用 LLM 将学术论文 PDF 自动转换为 HTML 幻灯片

![Zotero](https://img.shields.io/badge/Zotero-7%20%7C%208-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ 功能特性

- 📄 **PDF 文本提取** - 自动从 Zotero 中的 PDF 附件提取文本
- 🤖 **多 LLM 支持** - 支持 DeepSeek、Kimi、豆包、智谱、OpenAI、Gemini 等
- 🌐 **中英文输出** - 可选择生成中文或英文幻灯片
- 🎨 **多种样式** - 现代渐变、极简白、暗色主题、学术风格
- ⚙️ **可视化设置** - 在 Zotero 设置中直接配置

## 📦 安装

### 方法 1: 从源码安装（开发模式）

1. 下载或克隆本仓库
2. 打开 Zotero → 工具 → 附加组件
3. 点击齿轮图标 → 从文件安装附加组件 (Install Add-on From File)
4. 选择 `paper2slide` 文件夹
5. **重要**: 勾选 "作为异步函数执行" (Run as async)

### 方法 2: 安装 XPI 文件

1. 下载最新的 `.xpi` 文件
2. 打开 Zotero → 工具 → 附加组件
3. 拖放 `.xpi` 文件到窗口中

## 🚀 使用方法

### 1. 配置 API

打开 **Zotero 设置 → Paper2Slide**，配置：

| 设置项 | 说明 |
|--------|------|
| API 提供商 | 选择 DeepSeek / Kimi / 豆包 / 智谱 / OpenAI / Gemini |
| API Key | 填入对应平台的 API 密钥 |
| 输出语言 | 中文 / English |
| Prompt 预设 | 学术风格 / 简洁版 / 详细版 |
| 幻灯片样式 | 现代渐变 / 极简白 / 暗色主题 / 学术风格 |

### 2. 生成幻灯片

1. 在 Zotero 中选择一篇带有 PDF 附件的论文
2. **右键点击 → Generate HTML Slides (LLM)**
3. 等待 30-60 秒（取决于论文长度和网络速度）
4. 生成的 HTML 文件会自动保存为该条目的附件

## 🔧 支持的 LLM 提供商

| 提供商 | 默认模型 | API 地址 |
|--------|----------|----------|
| DeepSeek | deepseek-chat | api.deepseek.com |
| Kimi (月之暗面) | moonshot-v1-8k | api.moonshot.cn |
| 豆包 (字节跳动) | doubao-pro-4k | ark.cn-beijing.volces.com |
| 智谱 GLM | glm-4-flash | open.bigmodel.cn |
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

## 📄 License

MIT License

## 🙏 致谢

- [Zotero](https://www.zotero.org/) - 优秀的文献管理工具
- 各 LLM 提供商提供的 API 服务
