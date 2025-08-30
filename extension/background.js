// TransMeet Chrome Extension - Background Service Worker
// 处理音频捕获和翻译请求

// 监听安装事件
chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install') {
        // 首次安装，设置默认配置
        const defaultSettings = {
            enabled: true,
            sourceLang: 'auto',
            targetLang: 'zh-CN',
            autoTranslate: true,
            showFloating: true,
            translationService: 'demo',
            apiKey: '',
            captureMode: 'tab' // tab: 标签页音频, mic: 麦克风
        };
        
        chrome.storage.sync.set({ settings: defaultSettings }, function() {
            console.log('TransMeet installed with default settings');
        });
        
        console.log('TransMeet extension installed successfully');
    } else if (details.reason === 'update') {
        console.log('TransMeet updated to version', chrome.runtime.getManifest().version);
    }
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startCapture') {
        // 开始捕获音频
        startAudioCapture(sender.tab.id)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ error: error.message }));
        return true;
    } else if (request.action === 'stopCapture') {
        // 停止捕获音频
        stopAudioCapture()
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ error: error.message }));
        return true;
    } else if (request.action === 'translate') {
        // 处理翻译请求
        handleTranslation(request)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ error: error.message }));
        return true;
    } else if (request.action === 'getSettings') {
        // 获取设置
        chrome.storage.sync.get(['settings'], function(result) {
            sendResponse(result.settings || {});
        });
        return true;
    }
});

// 音频捕获相关变量
let captureStream = null;
let isCapturing = false;

// 开始音频捕获
async function startAudioCapture(tabId) {
    if (isCapturing) {
        return { success: false, message: '已经在捕获中' };
    }
    
    try {
        // 使用chrome.tabCapture API (需要用户交互)
        // 注意：Manifest V3中，需要通过用户操作触发
        
        // 方案1：使用屏幕共享API获取音频
        // 这需要在内容脚本中调用 navigator.mediaDevices.getDisplayMedia
        
        // 方案2：使用麦克风输入
        // 这需要在内容脚本中调用 navigator.mediaDevices.getUserMedia
        
        isCapturing = true;
        return { 
            success: true, 
            message: '音频捕获已启动',
            instruction: '请在页面中选择音频源'
        };
    } catch (error) {
        console.error('Audio capture error:', error);
        return { success: false, error: error.message };
    }
}

// 停止音频捕获
async function stopAudioCapture() {
    if (!isCapturing) {
        return { success: false, message: '没有正在进行的捕获' };
    }
    
    if (captureStream) {
        captureStream.getTracks().forEach(track => track.stop());
        captureStream = null;
    }
    
    isCapturing = false;
    return { success: true, message: '音频捕获已停止' };
}

// 处理翻译请求
async function handleTranslation(request) {
    const { text, sourceLang, targetLang, service, apiKey } = request;
    
    try {
        let translation;
        
        switch (service) {
            case 'openai':
                translation = await translateWithOpenAI(text, sourceLang, targetLang, apiKey);
                break;
            case 'google':
                translation = await translateWithGoogle(text, sourceLang, targetLang, apiKey);
                break;
            case 'deepl':
                translation = await translateWithDeepL(text, sourceLang, targetLang, apiKey);
                break;
            case 'demo':
            default:
                translation = await demoTranslate(text, sourceLang, targetLang);
                break;
        }
        
        return { translation };
    } catch (error) {
        console.error('Translation error:', error);
        throw error;
    }
}

// OpenAI翻译
async function translateWithOpenAI(text, sourceLang, targetLang, apiKey) {
    const endpoint = 'https://api.openai.com/v1/chat/completions';
    
    const langMap = {
        'zh-CN': 'Chinese Simplified',
        'zh-TW': 'Chinese Traditional',
        'en-US': 'English',
        'ja-JP': 'Japanese',
        'ko-KR': 'Korean',
        'es-ES': 'Spanish',
        'fr-FR': 'French',
        'de-DE': 'German',
        'ru-RU': 'Russian',
        'ar-SA': 'Arabic',
        'pt-BR': 'Portuguese',
        'auto': 'Auto-detect'
    };
    
    const sourceLanguage = langMap[sourceLang] || 'Auto-detect';
    const targetLanguage = langMap[targetLang] || 'English';
    
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: `You are a professional translator. Translate from ${sourceLanguage} to ${targetLanguage}. Only provide the translation without any explanation.`
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature: 0.3,
            max_tokens: 500
        })
    });
    
    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
}

// Google翻译
async function translateWithGoogle(text, sourceLang, targetLang, apiKey) {
    const endpoint = `https://translation.googleapis.com/language/translate/v2`;
    
    const langCodeMap = {
        'zh-CN': 'zh-CN',
        'zh-TW': 'zh-TW',
        'en-US': 'en',
        'ja-JP': 'ja',
        'ko-KR': 'ko',
        'auto': 'auto'
    };
    
    const source = langCodeMap[sourceLang] || 'auto';
    const target = langCodeMap[targetLang] || targetLang.split('-')[0];
    
    const params = new URLSearchParams({
        key: apiKey,
        q: text,
        target: target
    });
    
    if (source !== 'auto') {
        params.append('source', source);
    }
    
    const response = await fetch(`${endpoint}?${params}`, {
        method: 'POST'
    });
    
    if (!response.ok) {
        throw new Error(`Google Translate API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data.translations[0].translatedText;
}

// DeepL翻译
async function translateWithDeepL(text, sourceLang, targetLang, apiKey) {
    const endpoint = 'https://api-free.deepl.com/v2/translate';
    
    const langCodeMap = {
        'zh-CN': 'ZH',
        'en-US': 'EN-US',
        'ja-JP': 'JA',
        'ko-KR': 'KO',
        'auto': null
    };
    
    const source = langCodeMap[sourceLang];
    const target = langCodeMap[targetLang] || 'EN-US';
    
    const formData = new FormData();
    formData.append('auth_key', apiKey);
    formData.append('text', text);
    if (source) formData.append('source_lang', source);
    formData.append('target_lang', target);
    
    const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) {
        throw new Error(`DeepL API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.translations[0].text;
}

// 演示翻译
async function demoTranslate(text, sourceLang, targetLang) {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 增强的翻译映射
    const translations = {
        // 中文到英文
        '你好': 'Hello',
        '谢谢': 'Thank you',
        '再见': 'Goodbye',
        '早上好': 'Good morning',
        '晚上好': 'Good evening',
        '很高兴认识你': 'Nice to meet you',
        '今天天气很好': 'The weather is nice today',
        '请问你叫什么名字': 'What is your name?',
        '会议': 'meeting',
        '项目': 'project',
        '开发': 'development',
        '测试': 'testing',
        '需求': 'requirements',
        '进展': 'progress',
        '讨论': 'discuss',
        '时间表': 'timeline',
        '感谢': 'thank',
        '参与': 'participation',
        
        // 英文到中文
        'Hello': '你好',
        'Thank you': '谢谢',
        'Goodbye': '再见',
        'Good morning': '早上好',
        'Good evening': '晚上好',
        'Nice to meet you': '很高兴认识你',
        'The weather is nice today': '今天天气很好',
        'What is your name?': '请问你叫什么名字？',
        'Welcome': '欢迎',
        'meeting': '会议',
        'project': '项目',
        'development': '开发',
        'testing': '测试',
        'requirements': '需求',
        'progress': '进展',
        'discuss': '讨论',
        'timeline': '时间表',
        'thank': '感谢',
        'participation': '参与',
        
        // 常见YouTube词汇
        'subscribe': '订阅',
        'like': '点赞',
        'comment': '评论',
        'share': '分享',
        'video': '视频',
        'channel': '频道',
        'playlist': '播放列表',
        'notification': '通知',
        'Subscribe': '订阅',
        'Like': '点赞',
        'Comment': '评论',
        'Share': '分享',
        'Video': '视频',
        'Channel': '频道'
    };
    
    // 尝试直接翻译
    let translatedText = text;
    for (const [key, value] of Object.entries(translations)) {
        const regex = new RegExp(`\\b${key}\\b`, 'gi');
        translatedText = translatedText.replace(regex, value);
    }
    
    if (translatedText !== text) {
        return translatedText;
    }
    
    // 检测语言并返回模拟翻译
    const hasChineseChar = /[\u4e00-\u9fa5]/.test(text);
    const hasEnglishChar = /[a-zA-Z]/.test(text);
    
    if (hasChineseChar && targetLang.startsWith('en')) {
        return `[Translation: ${text}]`;
    } else if (hasEnglishChar && targetLang.startsWith('zh')) {
        return `[翻译: ${text}]`;
    } else {
        return `[${targetLang}: ${text}]`;
    }
}

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // 检查是否是视频网站
        const videoSites = [
            'youtube.com',
            'bilibili.com',
            'vimeo.com',
            'twitch.tv',
            'meet.google.com',
            'zoom.us'
        ];
        
        const isVideoSite = videoSites.some(site => tab.url.includes(site));
        
        if (isVideoSite) {
            // 通知内容脚本这是一个视频网站
            chrome.tabs.sendMessage(tabId, {
                action: 'videoSiteDetected',
                url: tab.url
            }).catch(err => {
                // 内容脚本可能还未加载
                console.log('Content script not ready yet');
            });
        }
    }
});

console.log('TransMeet background service worker loaded');