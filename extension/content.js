// TransMeet Chrome Extension - Content Script
// 在Google Meet页面中注入翻译功能

console.log('TransMeet Extension loaded on Google Meet');

// 全局变量
let isTranslating = false;
let settings = {};
let subtitleObserver = null;
let floatingWindow = null;

// 初始化
chrome.storage.sync.get(['settings'], function(result) {
    settings = result.settings || {
        enabled: true,
        sourceLang: 'zh-CN',
        targetLang: 'en-US',
        autoTranslate: true,
        showFloating: true,
        translationService: 'demo'
    };
    
    if (settings.enabled) {
        initTransMeet();
    }
});

// 初始化TransMeet
function initTransMeet() {
    // 创建悬浮窗口
    if (settings.showFloating) {
        createFloatingWindow();
    }
    
    // 监听字幕变化
    observeSubtitles();
    
    // 监听设置更新
    chrome.runtime.onMessage.addListener(handleMessage);
}

// 创建悬浮翻译窗口
function createFloatingWindow() {
    // 检查是否已存在
    if (floatingWindow) return;
    
    floatingWindow = document.createElement('div');
    floatingWindow.id = 'transmeet-floating';
    floatingWindow.innerHTML = `
        <div class="transmeet-header">
            <span class="transmeet-title">🌐 TransMeet</span>
            <div class="transmeet-controls">
                <button id="transmeet-minimize" title="最小化">_</button>
                <button id="transmeet-close" title="关闭">×</button>
            </div>
        </div>
        <div class="transmeet-content">
            <div class="transmeet-status">
                <span class="status-dot online"></span>
                <span id="transmeet-status-text">实时翻译中</span>
            </div>
            <div class="transmeet-languages">
                <select id="transmeet-source-lang">
                    <option value="auto">自动检测</option>
                    <option value="zh-CN">中文</option>
                    <option value="en-US">English</option>
                    <option value="ja-JP">日本語</option>
                    <option value="ko-KR">한국어</option>
                </select>
                <span class="lang-arrow">→</span>
                <select id="transmeet-target-lang">
                    <option value="en-US">English</option>
                    <option value="zh-CN">中文</option>
                    <option value="ja-JP">日本語</option>
                    <option value="ko-KR">한국어</option>
                </select>
            </div>
            <div id="transmeet-subtitles" class="transmeet-subtitles">
                <!-- 翻译内容将显示在这里 -->
            </div>
        </div>
    `;
    
    document.body.appendChild(floatingWindow);
    
    // 设置初始语言
    document.getElementById('transmeet-source-lang').value = settings.sourceLang;
    document.getElementById('transmeet-target-lang').value = settings.targetLang;
    
    // 添加事件监听
    setupFloatingWindowEvents();
    
    // 使窗口可拖动
    makeWindowDraggable();
}

// 设置悬浮窗事件
function setupFloatingWindowEvents() {
    // 关闭按钮
    document.getElementById('transmeet-close').addEventListener('click', () => {
        floatingWindow.remove();
        floatingWindow = null;
        settings.showFloating = false;
        saveSettings();
    });
    
    // 最小化按钮
    document.getElementById('transmeet-minimize').addEventListener('click', () => {
        const content = floatingWindow.querySelector('.transmeet-content');
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
    });
    
    // 语言切换
    document.getElementById('transmeet-source-lang').addEventListener('change', (e) => {
        settings.sourceLang = e.target.value;
        saveSettings();
    });
    
    document.getElementById('transmeet-target-lang').addEventListener('change', (e) => {
        settings.targetLang = e.target.value;
        saveSettings();
    });
}

// 使窗口可拖动
function makeWindowDraggable() {
    const header = floatingWindow.querySelector('.transmeet-header');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    
    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    function dragStart(e) {
        if (e.target.tagName === 'BUTTON') return;
        
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        
        if (e.target === header || header.contains(e.target)) {
            isDragging = true;
        }
    }
    
    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            
            xOffset = currentX;
            yOffset = currentY;
            
            floatingWindow.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
    }
    
    function dragEnd(e) {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }
}

// 监听Google Meet字幕
function observeSubtitles() {
    // Google Meet字幕容器的可能选择器
    const subtitleSelectors = [
        '[jsname="dsyhDe"]', // 新版Meet
        '.a4cQT', // 旧版Meet
        '[jsname="tgaKEf"]', // 字幕文本容器
        '.TBMuR', // 字幕行
        '.Mz6pEf', // 发言人名称
        '.iTTPOb' // 字幕文本
    ];
    
    // 尝试找到字幕容器
    let subtitleContainer = null;
    for (const selector of subtitleSelectors) {
        subtitleContainer = document.querySelector(selector);
        if (subtitleContainer) break;
    }
    
    if (!subtitleContainer) {
        // 如果找不到，稍后重试
        setTimeout(observeSubtitles, 2000);
        return;
    }
    
    // 创建MutationObserver监听字幕变化
    subtitleObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
                handleSubtitleChange(mutation.target);
            }
        });
    });
    
    // 开始观察
    subtitleObserver.observe(subtitleContainer, {
        childList: true,
        subtree: true,
        characterData: true
    });
    
    console.log('Started observing subtitles');
}

// 处理字幕变化
function handleSubtitleChange(element) {
    // 获取字幕文本
    let subtitleText = '';
    
    // 尝试不同的方式获取文本
    if (element.textContent) {
        subtitleText = element.textContent.trim();
    } else if (element.innerText) {
        subtitleText = element.innerText.trim();
    }
    
    // 过滤掉发言人名称（通常在冒号前）
    if (subtitleText.includes(':')) {
        subtitleText = subtitleText.split(':').slice(1).join(':').trim();
    }
    
    if (subtitleText && settings.autoTranslate) {
        translateSubtitle(subtitleText);
    }
}

// 翻译字幕
async function translateSubtitle(text) {
    if (!text || isTranslating) return;
    
    isTranslating = true;
    
    try {
        const translation = await performTranslation(text);
        displayTranslation(text, translation);
    } catch (error) {
        console.error('Translation error:', error);
    } finally {
        isTranslating = false;
    }
}

// 执行翻译
async function performTranslation(text) {
    // 如果是演示模式，使用简单翻译
    if (settings.translationService === 'demo' || !settings.apiKey) {
        return await demoTranslate(text);
    }
    
    // 使用真实API
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'translate',
            text: text,
            sourceLang: settings.sourceLang,
            targetLang: settings.targetLang,
            service: settings.translationService,
            apiKey: settings.apiKey
        });
        
        return response.translation;
    } catch (error) {
        console.error('API translation failed:', error);
        return await demoTranslate(text);
    }
}

// 演示翻译
async function demoTranslate(text) {
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 简单的翻译映射
    const translations = {
        '你好': 'Hello',
        '谢谢': 'Thank you',
        '再见': 'Goodbye',
        '早上好': 'Good morning',
        '晚上好': 'Good evening',
        'Hello': '你好',
        'Thank you': '谢谢',
        'Goodbye': '再见',
        'Good morning': '早上好',
        'Good evening': '晚上好'
    };
    
    // 检查是否有预定义翻译
    for (const [key, value] of Object.entries(translations)) {
        if (text.toLowerCase().includes(key.toLowerCase())) {
            return text.toLowerCase().replace(key.toLowerCase(), value);
        }
    }
    
    // 返回模拟翻译
    if (settings.sourceLang.startsWith('zh') && settings.targetLang.startsWith('en')) {
        return `[Translation: ${text}]`;
    } else if (settings.sourceLang.startsWith('en') && settings.targetLang.startsWith('zh')) {
        return `[翻译: ${text}]`;
    } else {
        return `[Translated: ${text}]`;
    }
}

// 显示翻译
function displayTranslation(original, translation) {
    if (!floatingWindow) return;
    
    const subtitlesContainer = document.getElementById('transmeet-subtitles');
    if (!subtitlesContainer) return;
    
    // 创建新的字幕项
    const subtitleItem = document.createElement('div');
    subtitleItem.className = 'transmeet-subtitle-item';
    subtitleItem.innerHTML = `
        <div class="subtitle-time">${new Date().toLocaleTimeString()}</div>
        <div class="subtitle-original">${original}</div>
        <div class="subtitle-translation">${translation}</div>
    `;
    
    // 添加到容器顶部
    subtitlesContainer.insertBefore(subtitleItem, subtitlesContainer.firstChild);
    
    // 限制显示数量
    while (subtitlesContainer.children.length > 10) {
        subtitlesContainer.removeChild(subtitlesContainer.lastChild);
    }
    
    // 保存到历史
    saveToHistory(original, translation);
}

// 保存到历史记录
function saveToHistory(original, translation) {
    chrome.storage.local.get(['history'], function(result) {
        const history = result.history || [];
        history.unshift({
            timestamp: new Date().toISOString(),
            original: original,
            translation: translation,
            sourceLang: settings.sourceLang,
            targetLang: settings.targetLang
        });
        
        // 限制历史记录数量
        if (history.length > 100) {
            history.splice(100);
        }
        
        chrome.storage.local.set({ history: history });
    });
}

// 保存设置
function saveSettings() {
    chrome.storage.sync.set({ settings: settings });
}

// 处理来自popup的消息
function handleMessage(request, sender, sendResponse) {
    if (request.action === 'updateSettings') {
        settings = request.settings;
        
        // 更新UI
        if (floatingWindow) {
            document.getElementById('transmeet-source-lang').value = settings.sourceLang;
            document.getElementById('transmeet-target-lang').value = settings.targetLang;
            
            if (!settings.showFloating) {
                floatingWindow.remove();
                floatingWindow = null;
            }
        } else if (settings.showFloating) {
            createFloatingWindow();
        }
    } else if (request.action === 'toggleTranslation') {
        settings.enabled = !settings.enabled;
        
        if (settings.enabled) {
            initTransMeet();
        } else {
            if (subtitleObserver) {
                subtitleObserver.disconnect();
            }
            if (floatingWindow) {
                floatingWindow.remove();
                floatingWindow = null;
            }
        }
    }
    
    sendResponse({ success: true });
}

// 模拟字幕流（用于测试）
function simulateSubtitles() {
    const testSubtitles = [
        "Hello everyone, welcome to our meeting",
        "Today we'll discuss the project timeline",
        "大家好，欢迎参加会议",
        "今天我们讨论项目时间表",
        "Let's start with the first agenda item",
        "请大家看第一项议程"
    ];
    
    let index = 0;
    setInterval(() => {
        if (settings.enabled && settings.autoTranslate) {
            translateSubtitle(testSubtitles[index % testSubtitles.length]);
            index++;
        }
    }, 5000);
}

// 如果是开发模式，启动模拟
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('Development mode: Starting subtitle simulation');
    simulateSubtitles();
}