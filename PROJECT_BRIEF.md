# TransMeet 项目简介 (Project Brief)

## 🎯 项目概述
**TransMeet** 是一个基于纯前端技术的实时双向会议翻译系统，专为 Google Meet 等在线会议平台设计。该项目实现了语音识别(ASR)、机器翻译(MT)和语音合成(TTS)的完整流程，无需后端服务器即可运行。

**GitHub 仓库**: https://github.com/0xFredZhang/transmeet

## 🏗️ 项目结构
```
/transmeet
├── /assets                 # 核心资源文件
│   ├── app.js             # 核心翻译逻辑 (ASR/MT/TTS)
│   └── styles.css         # 自定义样式
├── /pages                 # 主要页面
│   ├── index.html         # 主入口页面
│   ├── meeting.html       # 会议翻译界面 (核心功能页)
│   ├── settings.html      # 设置页面
│   └── history.html       # 历史记录页面
├── /extension             # Chrome 扩展
│   ├── manifest.json      # 扩展配置 (Manifest V3)
│   ├── background.js      # 后台服务脚本
│   ├── content.js         # 内容注入脚本
│   ├── popup.html         # 扩展弹窗界面
│   ├── popup.js           # 弹窗逻辑
│   └── styles.css         # 扩展样式
├── LICENSE                # MIT 开源协议
├── README.md              # 项目文档
└── prompt.txt             # 原始需求文档
```

## 💡 核心功能

### 1. 语音识别 (ASR)
- **主要技术**: Web Speech API (SpeechRecognition)
- **备选方案**: OpenAI Whisper API, Google Speech-to-Text
- **实现位置**: 
  - `meeting.html`: 麦克风录音和系统音频捕获
  - `app.js`: recognizeSpeechCloud() 函数

### 2. 翻译服务 (MT)
- **支持服务**: 
  - OpenAI GPT (完整实现)
  - Google Translate (完整实现)
  - DeepL (完整实现)
  - AWS Translate (完整实现)
  - Demo 模式 (无需API)
- **核心代码**: `app.js` - translateText() 及各服务的翻译函数

### 3. 语音合成 (TTS)
- **主要技术**: Web Speech Synthesis API
- **备选方案**: OpenAI TTS, Google Cloud TTS, Azure TTS
- **实现位置**: `app.js` - speakText() 函数

### 4. 会议功能
- **双语字幕显示**: 实时显示原文和译文
- **音频捕获模式**:
  - 麦克风模式（我方发言）
  - 系统音频模式（对方发言）
  - 手动输入模式（测试）
- **自动功能**:
  - 自动语音识别（无需手动开始）
  - 自动翻译
  - 自动朗读译文
  - 自动模拟字幕（测试用）

### 5. Chrome 扩展
- **功能**: 在 Google Meet 页面注入翻译功能
- **特性**: 
  - 悬浮翻译窗口
  - 实时字幕捕获
  - 独立配置界面

## 🔧 技术栈
- **前端框架**: 原生 JavaScript (ES6+)
- **样式**: Tailwind CSS (CDN) + 自定义CSS
- **存储**: LocalStorage (设置和历史)
- **扩展**: Chrome Extension Manifest V3
- **API集成**: REST API (fetch)

## 📦 关键配置

### API 密钥存储
- 存储位置: LocalStorage
- 键名: `transmeet_settings`
- 结构:
```javascript
{
  translationService: 'openai|google|deepl|aws|demo',
  apiKey: 'xxx',
  awsAccessKeyId: 'xxx',     // AWS专用
  awsSecretAccessKey: 'xxx', // AWS专用
  awsRegion: 'us-east-1',    // AWS专用
  sourceLang: 'zh-CN',
  targetLang: 'en-US',
  // ... 其他设置
}
```

### 历史记录存储
- 键名: `transmeet_history`
- 结构: 数组，每项包含:
```javascript
{
  timestamp: ISO时间戳,
  original: 原文,
  translation: 译文,
  sourceLang: 源语言,
  targetLang: 目标语言
}
```

## 🚨 已知问题和解决方案

### 1. 系统音频捕获限制
- **问题**: Web Speech API 无法直接处理系统音频流
- **解决**: 提供模拟字幕输入和自动模拟功能作为备选

### 2. API 密钥检查
- **问题**: 不同服务需要不同的凭证检查
- **实现**: 
  - Demo 模式: 无需密钥
  - AWS: 检查 awsAccessKeyId 和 awsSecretAccessKey
  - 其他: 检查通用 apiKey

### 3. 自动录音
- **实现**: 系统音频捕获后自动开始识别
- **重启机制**: 识别中断后自动重新开始

## 🎮 关键交互流程

### 会议翻译流程
1. 用户选择音频输入模式
2. 开始捕获（麦克风/系统音频）
3. 实时语音识别
4. 立即显示原文字幕
5. 异步调用翻译API
6. 更新译文显示
7. 可选：TTS朗读译文

### 设置流程
1. 选择翻译服务
2. 输入对应API密钥
3. 配置语言对（源语言/目标语言）
4. 设置语音参数（速度/音量）
5. 保存到LocalStorage

## 📝 最近更新
1. 修复了 AWS 凭证检查问题
2. 添加了完整的 AWS 区域列表（31个区域）
3. 实现了自动语音识别（无需手动开始）
4. 修复了字幕实时显示问题
5. 更新了 GitHub 仓库地址

## 🔑 快速上手

### 本地运行
1. 直接打开 `pages/index.html`
2. 首次使用会提示进行基本设置
3. Demo 模式无需API密钥即可体验

### Chrome 扩展安装
1. 打开 `chrome://extensions/`
2. 开启开发者模式
3. 加载 `extension` 文件夹
4. 在 Google Meet 中使用

## 🛠️ 开发建议

### 添加新翻译服务
1. 在 `app.js` 中添加翻译函数
2. 在 `translateText()` switch 中添加 case
3. 在设置页面添加服务选项
4. 更新 API 密钥检查逻辑

### 调试技巧
- 开启调试模式查看控制台输出
- 使用自动模拟功能测试翻译
- 手动输入文本验证翻译流程

## 📞 联系和支持
- GitHub Issues: https://github.com/0xFredZhang/transmeet/issues
- 主要维护者: @0xFredZhang

---
*最后更新: 2025-01-30*
*版本: 1.0.0*