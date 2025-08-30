// TransMeet Core JavaScript
// 核心翻译和语音处理逻辑

// 翻译函数 - 支持多种API
async function translateText(text, sourceLang, targetLang, settings) {
    if (!text || sourceLang === targetLang) return text;
    
    const service = settings.translationService || 'demo';
    
    // 调试模式
    if (settings.debugMode) {
        console.log(`Translating: ${text} (${sourceLang} → ${targetLang}) using ${service}`);
    }
    
    try {
        switch (service) {
            case 'openai':
                return await translateWithOpenAI(text, sourceLang, targetLang, settings);
            case 'google':
                return await translateWithGoogle(text, sourceLang, targetLang, settings);
            case 'deepl':
                return await translateWithDeepL(text, sourceLang, targetLang, settings);
            case 'aws':
                return await translateWithAWS(text, sourceLang, targetLang, settings);
            case 'demo':
            default:
                return await translateDemo(text, sourceLang, targetLang);
        }
    } catch (error) {
        console.error('Translation error:', error);
        throw error;
    }
}

// OpenAI翻译
async function translateWithOpenAI(text, sourceLang, targetLang, settings) {
    const apiKey = settings.apiKey;
    const endpoint = settings.apiEndpoint || 'https://api.openai.com/v1/chat/completions';
    
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
        'pt-BR': 'Portuguese',
        'it-IT': 'Italian'
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
                    content: `You are a professional translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}. Only provide the translation, no explanations.`
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            temperature: 0.3,
            max_tokens: 1000
        })
    });
    
    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim();
}

// Google翻译（需要API密钥）
async function translateWithGoogle(text, sourceLang, targetLang, settings) {
    const apiKey = settings.apiKey;
    const endpoint = `https://translation.googleapis.com/language/translate/v2`;
    
    // 语言代码映射
    const langCodeMap = {
        'zh-CN': 'zh-CN',
        'zh-TW': 'zh-TW',
        'en-US': 'en',
        'en-GB': 'en',
        'ja-JP': 'ja',
        'ko-KR': 'ko',
        'es-ES': 'es',
        'fr-FR': 'fr',
        'de-DE': 'de',
        'ru-RU': 'ru',
        'pt-BR': 'pt',
        'it-IT': 'it'
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
async function translateWithDeepL(text, sourceLang, targetLang, settings) {
    const apiKey = settings.apiKey;
    const endpoint = settings.apiEndpoint || 'https://api-free.deepl.com/v2/translate';
    
    // DeepL语言代码映射
    const langCodeMap = {
        'zh-CN': 'ZH',
        'zh-TW': 'ZH',
        'en-US': 'EN-US',
        'en-GB': 'EN-GB',
        'ja-JP': 'JA',
        'ko-KR': 'KO',
        'es-ES': 'ES',
        'fr-FR': 'FR',
        'de-DE': 'DE',
        'ru-RU': 'RU',
        'pt-BR': 'PT-BR',
        'it-IT': 'IT'
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

// AWS Translate翻译
async function translateWithAWS(text, sourceLang, targetLang, settings) {
    // AWS需要Access Key ID, Secret Access Key和Region
    const accessKeyId = settings.awsAccessKeyId || settings.apiKey;
    const secretAccessKey = settings.awsSecretAccessKey;
    const region = settings.awsRegion || 'us-east-1';
    
    // AWS Translate语言代码映射
    const langCodeMap = {
        'zh-CN': 'zh',
        'zh-TW': 'zh-TW',
        'en-US': 'en',
        'en-GB': 'en',
        'ja-JP': 'ja',
        'ko-KR': 'ko',
        'es-ES': 'es',
        'fr-FR': 'fr',
        'de-DE': 'de',
        'ru-RU': 'ru',
        'pt-BR': 'pt',
        'it-IT': 'it',
        'ar-SA': 'ar',
        'hi-IN': 'hi',
        'th-TH': 'th',
        'vi-VN': 'vi',
        'nl-NL': 'nl',
        'pl-PL': 'pl',
        'tr-TR': 'tr'
    };
    
    const sourceCode = langCodeMap[sourceLang] || 'auto';
    const targetCode = langCodeMap[targetLang] || 'en';
    
    // AWS Signature V4签名（简化版本，建议使用AWS SDK）
    const service = 'translate';
    const host = `${service}.${region}.amazonaws.com`;
    const endpoint = `https://${host}/`;
    
    // 创建请求体
    const requestBody = JSON.stringify({
        Text: text,
        SourceLanguageCode: sourceCode === 'auto' ? 'auto' : sourceCode,
        TargetLanguageCode: targetCode
    });
    
    // 创建签名（这里使用简化方法，实际应用建议使用AWS SDK）
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substr(0, 8);
    
    // 注意：这是简化版本，实际使用需要完整的AWS Signature V4实现
    // 建议使用AWS SDK for JavaScript
    const headers = {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSShineFrontendService_20170701.TranslateText',
        'X-Amz-Date': amzDate,
        'Host': host
    };
    
    // 如果没有配置AWS凭证，返回提示
    if (!accessKeyId || !secretAccessKey) {
        throw new Error('AWS credentials not configured. Please set AWS Access Key ID and Secret Access Key in settings.');
    }
    
    // 这里应该添加AWS Signature V4签名逻辑
    // 由于签名过程复杂，建议使用AWS SDK
    // 以下是使用AWS SDK的示例代码（需要引入AWS SDK）
    
    /*
    // 如果使用AWS SDK (需要先引入aws-sdk)
    const AWS = require('aws-sdk');
    AWS.config.update({
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
        region: region
    });
    
    const translate = new AWS.Translate();
    const params = {
        Text: text,
        SourceLanguageCode: sourceCode,
        TargetLanguageCode: targetCode
    };
    
    return new Promise((resolve, reject) => {
        translate.translateText(params, (err, data) => {
            if (err) reject(err);
            else resolve(data.TranslatedText);
        });
    });
    */
    
    // 临时方案：使用fetch直接调用（需要正确的签名）
    try {
        // 这里需要添加完整的AWS Signature V4签名
        // 由于浏览器环境限制，建议通过代理服务器或使用AWS Amplify
        console.warn('AWS Translate: Direct browser call requires proper CORS setup and signature. Consider using AWS Amplify or a proxy server.');
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: requestBody
        });
        
        if (!response.ok) {
            throw new Error(`AWS Translate API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.TranslatedText;
    } catch (error) {
        console.error('AWS Translate error:', error);
        throw new Error(`AWS Translate failed: ${error.message}. Note: Direct browser calls to AWS services require proper CORS configuration and signature. Consider using AWS Amplify or implementing a backend proxy.`);
    }
}

// 演示模式翻译（模拟）
async function translateDemo(text, sourceLang, targetLang) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 简单的模拟翻译规则
    const translations = {
        '你好': 'Hello',
        '谢谢': 'Thank you',
        '再见': 'Goodbye',
        '是': 'Yes',
        '否': 'No',
        '早上好': 'Good morning',
        '晚上好': 'Good evening',
        '很高兴认识你': 'Nice to meet you',
        'Hello': '你好',
        'Thank you': '谢谢',
        'Goodbye': '再见',
        'Yes': '是',
        'No': '否',
        'Good morning': '早上好',
        'Good evening': '晚上好',
        'Nice to meet you': '很高兴认识你'
    };
    
    // 检查是否有预定义翻译
    if (translations[text]) {
        return translations[text];
    }
    
    // 简单的规则翻译
    if (sourceLang.startsWith('zh') && targetLang.startsWith('en')) {
        return `[Translation of: ${text}]`;
    } else if (sourceLang.startsWith('en') && targetLang.startsWith('zh')) {
        return `[${text} 的翻译]`;
    } else {
        return `[Translated: ${text}]`;
    }
}

// 语音合成函数
function speakText(text, lang) {
    if (!text) return;
    
    const settings = JSON.parse(localStorage.getItem('transmeet_settings') || '{}');
    const ttsEngine = settings.ttsEngine || 'webspeech';
    
    if (ttsEngine === 'webspeech' && 'speechSynthesis' in window) {
        // 使用Web Speech API
        const utterance = new SpeechSynthesisUtterance(text);
        
        // 设置语言
        const langMap = {
            'zh-CN': 'zh-CN',
            'zh-TW': 'zh-TW',
            'en-US': 'en-US',
            'en-GB': 'en-GB',
            'ja-JP': 'ja-JP',
            'ko-KR': 'ko-KR',
            'es-ES': 'es-ES',
            'fr-FR': 'fr-FR',
            'de-DE': 'de-DE',
            'ru-RU': 'ru-RU',
            'pt-BR': 'pt-BR',
            'it-IT': 'it-IT'
        };
        
        utterance.lang = langMap[lang] || 'en-US';
        utterance.rate = settings.speechRate || 1.0;
        utterance.volume = settings.speechVolume || 1.0;
        
        // 选择合适的语音
        const voices = speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang === utterance.lang) || 
                     voices.find(v => v.lang.startsWith(lang.split('-')[0]));
        if (voice) {
            utterance.voice = voice;
        }
        
        speechSynthesis.speak(utterance);
    } else {
        // 其他TTS引擎的占位代码
        console.log('TTS Engine:', ttsEngine, 'Text:', text, 'Lang:', lang);
        
        if (ttsEngine === 'openai') {
            // OpenAI TTS API调用示例
            // 需要实现音频播放逻辑
            console.log('OpenAI TTS placeholder - implement audio streaming');
        } else if (ttsEngine === 'google') {
            // Google Cloud TTS API调用示例
            console.log('Google Cloud TTS placeholder');
        } else if (ttsEngine === 'azure') {
            // Azure Cognitive Services TTS API调用示例
            console.log('Azure TTS placeholder');
        }
    }
}

// ASR（语音识别）函数 - 云端API备选
async function recognizeSpeechCloud(audioBlob, lang, settings) {
    const asrEngine = settings.asrEngine || 'webspeech';
    
    if (asrEngine === 'whisper' && settings.apiKey) {
        // OpenAI Whisper API
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-1');
        formData.append('language', lang.split('-')[0]);
        
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.apiKey}`
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Whisper API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.text;
    } else if (asrEngine === 'google' && settings.apiKey) {
        // Google Cloud Speech-to-Text API
        console.log('Google Speech-to-Text placeholder - requires audio encoding');
        // 需要先将音频转换为base64并按Google API要求格式化
    }
    
    throw new Error('Cloud ASR not configured');
}

// 工具函数：格式化时间
function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

// 工具函数：语言代码转换为显示名称
function getLanguageName(code) {
    const names = {
        'zh-CN': '中文（简体）',
        'zh-TW': '中文（繁體）',
        'en-US': 'English (US)',
        'en-GB': 'English (UK)',
        'ja-JP': '日本語',
        'ko-KR': '한국어',
        'es-ES': 'Español',
        'fr-FR': 'Français',
        'de-DE': 'Deutsch',
        'ru-RU': 'Русский',
        'pt-BR': 'Português',
        'it-IT': 'Italiano'
    };
    return names[code] || code;
}

// 导出函数供页面使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        translateText,
        speakText,
        recognizeSpeechCloud,
        formatTime,
        getLanguageName
    };
}