// TransMeet Chrome Extension - Background Service Worker

// 监听安装事件
chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install') {
        // 首次安装，设置默认配置
        const defaultSettings = {
            enabled: true,
            sourceLang: 'zh-CN',
            targetLang: 'en-US',
            autoTranslate: true,
            showFloating: true,
            translationService: 'demo',
            apiKey: ''
        };
        
        chrome.storage.sync.set({ settings: defaultSettings }, function() {
            console.log('TransMeet installed with default settings');
        });
        
        // 打开欢迎页面
        chrome.tabs.create({
            url: chrome.runtime.getURL('../pages/index.html')
        });
    } else if (details.reason === 'update') {
        console.log('TransMeet updated to version', chrome.runtime.getManifest().version);
    }
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'translate') {
        // 处理翻译请求
        handleTranslation(request)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ error: error.message }));
        return true; // 保持消息通道开放
    } else if (request.action === 'updateStatistics') {
        // 更新统计信息
        updateStatistics(request.data);
    }
});

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
            case 'aws':
                // Note: AWS requires additional credentials
                translation = await demoTranslate(text, sourceLang, targetLang);
                console.log('AWS Translate requires Access Key ID and Secret Access Key. Using demo mode.');
                break;
            case 'demo':
            default:
                translation = await demoTranslate(text, sourceLang, targetLang);
                break;
        }
        
        // 更新统计
        updateTranslationCount();
        
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
        'en-US': 'English',
        'ja-JP': 'Japanese',
        'ko-KR': 'Korean',
        'es-ES': 'Spanish',
        'fr-FR': 'French'
    };
    
    const sourceLanguage = langMap[sourceLang] || 'Auto';
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
                    content: `You are a professional translator. Translate from ${sourceLanguage} to ${targetLanguage}. Only provide the translation.`
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
        'en-US': 'en',
        'ja-JP': 'ja',
        'ko-KR': 'ko'
    };
    
    const source = langCodeMap[sourceLang] || sourceLang.split('-')[0];
    const target = langCodeMap[targetLang] || targetLang.split('-')[0];
    
    const params = new URLSearchParams({
        key: apiKey,
        q: text,
        source: source,
        target: target,
        format: 'text'
    });
    
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
        'ko-KR': 'KO'
    };
    
    const source = langCodeMap[sourceLang];
    const target = langCodeMap[targetLang];
    
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
    
    // 简单的翻译映射
    const translations = {
        '你好': 'Hello',
        '谢谢': 'Thank you',
        '再见': 'Goodbye',
        '早上好': 'Good morning',
        '晚上好': 'Good evening',
        '很高兴认识你': 'Nice to meet you',
        '今天天气很好': 'The weather is nice today',
        '请问你叫什么名字': 'What is your name?',
        'Hello': '你好',
        'Thank you': '谢谢',
        'Goodbye': '再见',
        'Good morning': '早上好',
        'Good evening': '晚上好',
        'Nice to meet you': '很高兴认识你',
        'The weather is nice today': '今天天气很好',
        'What is your name?': '请问你叫什么名字？'
    };
    
    // 检查直接映射
    if (translations[text]) {
        return translations[text];
    }
    
    // 检查包含关系
    for (const [key, value] of Object.entries(translations)) {
        if (text.toLowerCase().includes(key.toLowerCase())) {
            return text.toLowerCase().replace(key.toLowerCase(), value);
        }
    }
    
    // 返回模拟翻译
    if (sourceLang.startsWith('zh') && targetLang.startsWith('en')) {
        return `[Translation: ${text}]`;
    } else if (sourceLang.startsWith('en') && targetLang.startsWith('zh')) {
        return `[翻译: ${text}]`;
    } else {
        return `[Translated: ${text}]`;
    }
}

// 更新翻译计数
function updateTranslationCount() {
    const today = new Date().toDateString();
    
    chrome.storage.local.get(['statistics'], function(result) {
        const stats = result.statistics || {
            todayCount: 0,
            totalCount: 0,
            lastDate: today,
            totalTime: 0
        };
        
        // 如果是新的一天，重置今日计数
        if (stats.lastDate !== today) {
            stats.todayCount = 0;
            stats.lastDate = today;
        }
        
        stats.todayCount++;
        stats.totalCount++;
        stats.totalTime += 3; // 假设每次翻译节省3秒
        
        chrome.storage.local.set({ statistics: stats });
    });
}

// 更新统计信息
function updateStatistics(data) {
    chrome.storage.local.get(['statistics'], function(result) {
        const stats = result.statistics || {};
        Object.assign(stats, data);
        chrome.storage.local.set({ statistics: stats });
    });
}

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes('meet.google.com')) {
        // Google Meet页面加载完成，可以注入额外的脚本
        chrome.storage.sync.get(['settings'], function(result) {
            if (result.settings && result.settings.enabled) {
                // 发送初始化消息
                chrome.tabs.sendMessage(tabId, {
                    action: 'init',
                    settings: result.settings
                });
            }
        });
    }
});

// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'transmeet-translate',
        title: 'TransMeet翻译选中文本',
        contexts: ['selection']
    });
});

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'transmeet-translate' && info.selectionText) {
        chrome.storage.sync.get(['settings'], function(result) {
            const settings = result.settings || {};
            handleTranslation({
                text: info.selectionText,
                sourceLang: 'auto',
                targetLang: settings.targetLang || 'en-US',
                service: settings.translationService || 'demo',
                apiKey: settings.apiKey
            }).then(response => {
                // 在新标签页显示翻译结果
                const resultHtml = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>TransMeet - 翻译结果</title>
                        <style>
                            body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                max-width: 800px;
                                margin: 50px auto;
                                padding: 20px;
                            }
                            .result-container {
                                background: #f8f9fa;
                                border-radius: 8px;
                                padding: 20px;
                                border-left: 4px solid #667eea;
                            }
                            .original {
                                color: #333;
                                margin-bottom: 15px;
                            }
                            .translation {
                                color: #667eea;
                                font-size: 1.1em;
                                font-weight: 500;
                            }
                            .label {
                                font-size: 0.9em;
                                color: #666;
                                margin-bottom: 5px;
                            }
                        </style>
                    </head>
                    <body>
                        <h1>🌐 TransMeet 翻译结果</h1>
                        <div class="result-container">
                            <div class="label">原文：</div>
                            <div class="original">${info.selectionText}</div>
                            <div class="label">译文：</div>
                            <div class="translation">${response.translation}</div>
                        </div>
                    </body>
                    </html>
                `;
                
                const blob = new Blob([resultHtml], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                chrome.tabs.create({ url });
            });
        });
    }
});