# 🌐 TransMeet - 实时会议翻译系统

TransMeet 是一个完全在前端运行的实时双向翻译系统，专为 Google Meet 等在线会议场景设计。支持语音识别、实时翻译、语音合成等功能，无需后端服务器即可运行。

## ✨ 主要功能

- **🎙️ 实时语音识别** - 使用 Web Speech API 进行语音转文字
- **🌍 多语言翻译** - 支持 OpenAI、Google、DeepL 等多种翻译服务
- **🔊 语音合成播放** - 自动朗读翻译结果
- **📝 双语字幕显示** - 实时显示原文和译文
- **🧩 Chrome 扩展** - 直接在 Google Meet 中使用
- **📊 历史记录管理** - 保存和导出翻译历史
- **⚙️ 灵活配置** - 自定义 API、语言对等设置

## 🚀 快速开始

### 方式一：直接使用网页版

1. **下载项目**
   ```bash
   git clone https://github.com/yourusername/transmeet.git
   cd transmeet
   ```

2. **打开主页**
   - 直接双击 `pages/index.html` 文件
   - 或在浏览器中打开：`file:///path/to/transmeet/pages/index.html`

3. **配置设置**
   - 点击"配置设置"进入设置页面
   - 选择翻译服务（默认为演示模式）
   - 如需使用真实 API，输入对应的 API 密钥

4. **开始使用**
   - 点击"进入会议"开始使用翻译功能
   - 点击"开始录音"进行语音识别和翻译

### 方式二：安装 Chrome 扩展

1. **打开 Chrome 扩展管理**
   - 在 Chrome 浏览器地址栏输入：`chrome://extensions/`
   - 或通过菜单：设置 → 扩展程序

2. **开启开发者模式**
   - 点击右上角"开发者模式"开关

3. **加载扩展**
   - 点击"加载已解压的扩展程序"
   - 选择 `transmeet/extension` 文件夹
   - 如果出现图标错误，请忽略（不影响功能）

4. **使用扩展**
   - 打开 [Google Meet](https://meet.google.com)
   - 点击浏览器工具栏的 TransMeet 图标进行配置
   - 扩展会自动在 Meet 页面显示悬浮翻译窗口

**注意**：扩展当前没有包含图标文件，但不影响核心功能的使用。

## 📁 项目结构

```
transmeet/
├── assets/
│   ├── app.js          # 核心翻译逻辑
│   └── styles.css      # 自定义样式
├── pages/
│   ├── index.html      # 主页
│   ├── meeting.html    # 会议翻译界面
│   ├── settings.html   # 设置页面
│   └── history.html    # 历史记录页面
├── extension/
│   ├── manifest.json   # Chrome 扩展配置
│   ├── content.js      # 内容脚本
│   ├── background.js   # 后台脚本
│   ├── popup.html      # 扩展弹窗
│   ├── popup.js        # 弹窗脚本
│   └── styles.css      # 扩展样式
└── README.md          # 项目文档
```

## 🔧 配置说明

### API 密钥配置

TransMeet 支持多种翻译服务，您可以根据需要选择：

#### 1. 演示模式（默认）
- 无需 API 密钥
- 提供基础的模拟翻译功能
- 适合测试和演示

#### 2. OpenAI
- 获取密钥：[platform.openai.com](https://platform.openai.com)
- 在设置中选择 "OpenAI" 并输入 API 密钥
- 支持高质量的上下文翻译

**详细申请步骤：**
1. 访问 [OpenAI Platform](https://platform.openai.com/signup)
2. 注册或登录账户
3. 进入 [API Keys 页面](https://platform.openai.com/api-keys)
4. 点击 "Create new secret key"
5. 复制生成的密钥（注意：密钥只显示一次）
6. 在 TransMeet 设置中粘贴密钥
7. 费用：按使用量计费，新用户有免费额度

#### 3. Google Translate
- 获取密钥：[console.cloud.google.com](https://console.cloud.google.com)
- 启用 Translation API
- 在设置中选择 "Google Translate" 并输入 API 密钥

**详细申请步骤：**
1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 创建新项目或选择现有项目
3. 启用 Cloud Translation API：
   - 在搜索栏搜索 "Cloud Translation API"
   - 点击启用（Enable）
4. 创建凭据：
   - 进入"凭据"页面
   - 点击"创建凭据" → "API 密钥"
   - 复制生成的 API 密钥
5. （可选）限制 API 密钥：
   - 点击编辑 API 密钥
   - 在"API 限制"中选择 "Cloud Translation API"
   - 保存
6. 费用：每月前 500,000 字符免费，超出按量计费

#### 4. DeepL
- 获取密钥：[www.deepl.com/pro-api](https://www.deepl.com/pro-api)
- 注册免费或付费账户
- 在设置中选择 "DeepL" 并输入 API 密钥

**详细申请步骤：**
1. 访问 [DeepL Pro](https://www.deepl.com/pro-api)
2. 选择计划：
   - DeepL API Free：免费，每月 500,000 字符
   - DeepL API Pro：付费，无限制
3. 注册账户并验证邮箱
4. 登录后进入 [账户页面](https://www.deepl.com/account)
5. 在 "Authentication Key for DeepL API" 部分
6. 复制 Authentication Key
7. 在 TransMeet 设置中粘贴密钥
8. 注意：免费版 API 端点为 `https://api-free.deepl.com/v2/translate`

#### 5. AWS Translate
- 需要 AWS 账户和相应权限
- 配置 Access Key ID、Secret Access Key 和 Region
- 支持更多语言和高级功能

**详细申请步骤：**
1. 访问 [AWS Console](https://aws.amazon.com/console/)
2. 注册或登录 AWS 账户
3. 创建 IAM 用户：
   - 进入 IAM 服务
   - 点击 "Users" → "Add users"
   - 输入用户名，选择 "Programmatic access"
   - 附加策略：搜索并选择 "TranslateFullAccess"
   - 创建用户
4. 保存凭证：
   - 下载 CSV 文件或复制 Access Key ID 和 Secret Access Key
   - **重要**：Secret Access Key 只显示一次
5. 在 TransMeet 设置中配置：
   - 选择 "AWS Translate"
   - 输入 Access Key ID
   - 输入 Secret Access Key
   - 选择 Region（如 us-east-1）
6. 费用：
   - 按字符计费：$15 per million characters
   - 新用户 12 个月内每月 200 万字符免费
7. 注意事项：
   - 浏览器直接调用需要配置 CORS
   - 建议使用 AWS Amplify 或代理服务器
   - 可考虑使用 AWS SDK for JavaScript

### 替换真实 API 的方法

1. **修改 `assets/app.js` 文件**

   OpenAI API 示例：
   ```javascript
   async function translateWithOpenAI(text, sourceLang, targetLang, settings) {
       const response = await fetch('https://api.openai.com/v1/chat/completions', {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${settings.apiKey}`
           },
           body: JSON.stringify({
               model: 'gpt-3.5-turbo',
               messages: [{
                   role: 'system',
                   content: `Translate from ${sourceLang} to ${targetLang}`
               }, {
                   role: 'user',
                   content: text
               }]
           })
       });
       const data = await response.json();
       return data.choices[0].message.content;
   }
   ```

2. **添加新的翻译服务**

   在 `translateText` 函数中添加新的 case：
   ```javascript
   case 'yourservice':
       return await translateWithYourService(text, sourceLang, targetLang, settings);
   ```

### 语音识别配置

默认使用浏览器的 Web Speech API。如需使用云端 ASR：

1. **OpenAI Whisper**
   ```javascript
   // 在 recognizeSpeechCloud 函数中
   const formData = new FormData();
   formData.append('file', audioBlob);
   formData.append('model', 'whisper-1');
   
   const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
       method: 'POST',
       headers: {
           'Authorization': `Bearer ${apiKey}`
       },
       body: formData
   });
   ```

2. **Google Speech-to-Text**
   - 需要音频编码为 base64
   - 参考 Google Cloud 文档实现

### 语音合成配置

默认使用浏览器的 Speech Synthesis API。如需使用云端 TTS：

1. **OpenAI TTS**
   ```javascript
   const response = await fetch('https://api.openai.com/v1/audio/speech', {
       method: 'POST',
       headers: {
           'Authorization': `Bearer ${apiKey}`,
           'Content-Type': 'application/json'
       },
       body: JSON.stringify({
           model: 'tts-1',
           input: text,
           voice: 'alloy'
       })
   });
   // 处理音频流并播放
   ```

2. **Google Text-to-Speech**
   - 调用 Google Cloud TTS API
   - 返回音频数据并播放

## 🎯 使用场景

1. **在线会议实时翻译**
   - Google Meet 会议
   - Zoom 会议（通过共享屏幕）
   - 其他视频会议平台

2. **语言学习**
   - 练习口语和听力
   - 实时查看翻译对比

3. **跨语言交流**
   - 国际会议
   - 商务谈判
   - 技术讨论

## 🛠️ 技术栈

- **前端框架**: 原生 JavaScript (ES6+)
- **样式框架**: Tailwind CSS
- **语音识别**: Web Speech API
- **语音合成**: Web Speech Synthesis API
- **翻译 API**: OpenAI / Google / DeepL / AWS Translate
- **数据存储**: LocalStorage / Chrome Storage API
- **扩展技术**: Chrome Extension Manifest V3

## 📋 浏览器兼容性

- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Safari 14.1+
- ⚠️ Firefox (部分功能受限)

注意：语音识别功能需要浏览器支持 Web Speech API

## 🔐 隐私说明

- 所有数据存储在本地浏览器
- API 密钥加密存储在本地
- 不收集或上传用户数据
- 翻译请求直接发送到选择的服务商

## 🐛 已知问题

1. **Google Meet 字幕识别**
   - Meet 更新可能导致字幕选择器失效
   - 解决方案：使用模拟字幕输入功能

2. **语音识别准确性**
   - 依赖浏览器实现，可能因口音而异
   - 建议：说话清晰，避免背景噪音

3. **API 限流**
   - 免费 API 可能有请求限制
   - 建议：合理使用，必要时升级付费计划

## 🚧 开发计划

- [ ] 支持更多翻译服务（百度、有道等）
- [ ] 添加离线翻译模型
- [ ] 支持更多会议平台（Zoom、Teams）
- [ ] 实现实时协同翻译
- [ ] 添加翻译质量评分
- [ ] 支持自定义词典
- [ ] 移动端适配

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 开源协议

本项目采用 MIT License 开源协议 - 详见 [LICENSE](LICENSE) 文件

**协议要点：**
- ✅ 免费使用、修改和分发
- ✅ 可用于商业项目
- ✅ 可以创建衍生作品
- ⚠️ 需保留版权声明
- ⚠️ 不提供任何担保
- ⚠️ 作者不承担任何责任

**使用注意：**
- 使用第三方 API 需遵守各服务商的服务条款
- 处理语音和文本数据需遵守隐私法规
- 商业使用建议进行充分测试和安全评估

## 🙏 致谢

- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Tailwind CSS](https://tailwindcss.com/)
- [OpenAI API](https://platform.openai.com/docs)
- [Google Cloud Translation](https://cloud.google.com/translate)
- [DeepL API](https://www.deepl.com/docs-api)

## 📧 联系方式

- 项目主页：[github.com/0xFredZhang/transmeet](https://github.com/0xFredZhang/transmeet)
- 问题反馈：[github.com/0xFredZhang/transmeet/issues](https://github.com/0xFredZhang/transmeet/issues)
- 邮箱：transmeet@example.com

---

**注意**: 本项目为教育和演示目的创建。在生产环境使用时，请确保遵守相关 API 服务条款，并妥善保护 API 密钥安全。