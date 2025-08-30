// TransMeet Chrome Extension - Universal Content Script
// 在任何网站上提供实时音频转字幕和翻译功能

console.log('TransMeet Extension loaded on', window.location.hostname);

// 全局变量
let settings = {};
let floatingWindow = null;
let audioProcessor = null;
let mediaStream = null;
let recognition = null;
let isCapturing = false;
let isTranslating = false;

// 初始化
function init() {
    chrome.storage.sync.get(['settings'], function(result) {
        settings = result.settings || {
            enabled: true,
            sourceLang: 'auto',
            targetLang: 'zh-CN',
            autoTranslate: true,
            showFloating: true,
            translationService: 'demo',
            captureMode: 'tab'
        };
        
        if (settings.enabled && settings.showFloating) {
            createFloatingWindow();
        }
    });
    
    // 监听来自background的消息
    chrome.runtime.onMessage.addListener(handleMessage);
}

// 创建悬浮翻译窗口
function createFloatingWindow() {
    if (floatingWindow) return;
    
    console.log('Creating TransMeet floating window...');
    
    floatingWindow = document.createElement('div');
    floatingWindow.id = 'transmeet-floating';
    floatingWindow.innerHTML = `
        <div class="transmeet-header">
            <span class="transmeet-title">🌐 TransMeet 实时翻译</span>
            <div class="transmeet-controls">
                <button id="transmeet-minimize" title="最小化">_</button>
                <button id="transmeet-close" title="关闭">×</button>
            </div>
        </div>
        <div class="transmeet-content">
            <div class="transmeet-capture-section">
                <div class="capture-buttons">
                    <button id="transmeet-capture-tab" class="capture-btn" title="捕获标签页音频">
                        <span>🔊</span>
                        <span>标签页音频</span>
                    </button>
                    <button id="transmeet-capture-mic" class="capture-btn" title="使用麦克风">
                        <span>🎤</span>
                        <span>麦克风</span>
                    </button>
                    <button id="transmeet-stop-capture" class="capture-btn stop-btn" style="display:none;" title="停止捕获">
                        <span>⏹️</span>
                        <span>停止</span>
                    </button>
                </div>
            </div>
            
            <div class="transmeet-status">
                <span class="status-dot" id="status-dot"></span>
                <span id="transmeet-status-text">准备就绪</span>
            </div>
            
            <div class="transmeet-languages">
                <select id="transmeet-source-lang">
                    <option value="auto">自动检测</option>
                    <option value="zh-CN">中文</option>
                    <option value="en-US">English</option>
                    <option value="ja-JP">日本語</option>
                    <option value="ko-KR">한국어</option>
                    <option value="es-ES">Español</option>
                    <option value="fr-FR">Français</option>
                    <option value="de-DE">Deutsch</option>
                    <option value="ru-RU">Русский</option>
                </select>
                <span class="lang-arrow">→</span>
                <select id="transmeet-target-lang">
                    <option value="zh-CN">中文</option>
                    <option value="en-US">English</option>
                    <option value="ja-JP">日本語</option>
                    <option value="ko-KR">한국어</option>
                    <option value="es-ES">Español</option>
                    <option value="fr-FR">Français</option>
                    <option value="de-DE">Deutsch</option>
                    <option value="ru-RU">Русский</option>
                </select>
            </div>
            
            <div class="transmeet-info">
                💡 点击"标签页音频"捕获网页声音，或点击"麦克风"录制您的声音
            </div>
            
            <div id="transmeet-subtitles" class="transmeet-subtitles">
                <!-- 字幕和翻译将显示在这里 -->
            </div>
        </div>
    `;
    
    // 注入样式
    injectStyles();
    
    document.body.appendChild(floatingWindow);
    
    // 设置初始语言
    document.getElementById('transmeet-source-lang').value = settings.sourceLang;
    document.getElementById('transmeet-target-lang').value = settings.targetLang;
    
    // 添加事件监听
    setupEventListeners();
    
    // 使窗口可拖动
    makeWindowDraggable();
    
    console.log('Floating window created successfully');
}

// 注入样式
function injectStyles() {
    if (document.getElementById('transmeet-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'transmeet-styles';
    style.textContent = `
        #transmeet-floating {
            position: fixed !important;
            right: 20px !important;
            bottom: 20px !important;
            width: 420px !important;
            background: white !important;
            border-radius: 12px !important;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2) !important;
            z-index: 2147483647 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
        
        .transmeet-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: white !important;
            padding: 12px 15px !important;
            border-radius: 12px 12px 0 0 !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            cursor: move !important;
            user-select: none !important;
        }
        
        .transmeet-title {
            font-size: 14px !important;
            font-weight: bold !important;
        }
        
        .transmeet-controls {
            display: flex !important;
            gap: 5px !important;
        }
        
        .transmeet-controls button {
            background: rgba(255, 255, 255, 0.2) !important;
            border: none !important;
            color: white !important;
            width: 28px !important;
            height: 24px !important;
            border-radius: 4px !important;
            cursor: pointer !important;
            font-size: 14px !important;
            line-height: 1 !important;
            padding: 0 !important;
        }
        
        .transmeet-controls button:hover {
            background: rgba(255, 255, 255, 0.3) !important;
        }
        
        .transmeet-content {
            padding: 15px !important;
            max-height: 500px !important;
            overflow-y: auto !important;
        }
        
        .transmeet-capture-section {
            margin-bottom: 15px !important;
        }
        
        .capture-buttons {
            display: flex !important;
            gap: 10px !important;
            justify-content: center !important;
        }
        
        .capture-btn {
            flex: 1 !important;
            padding: 10px !important;
            background: #f0f0f0 !important;
            border: 2px solid transparent !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 5px !important;
            transition: all 0.3s !important;
            font-size: 12px !important;
            color: #333 !important;
        }
        
        .capture-btn:hover {
            background: #e0e0e0 !important;
            border-color: #667eea !important;
        }
        
        .capture-btn.active {
            background: #667eea !important;
            color: white !important;
            border-color: #667eea !important;
        }
        
        .capture-btn.stop-btn {
            background: #ef4444 !important;
            color: white !important;
        }
        
        .capture-btn.stop-btn:hover {
            background: #dc2626 !important;
        }
        
        .capture-btn span:first-child {
            font-size: 20px !important;
        }
        
        .transmeet-status {
            display: flex !important;
            align-items: center !important;
            margin-bottom: 15px !important;
            font-size: 13px !important;
            color: #666 !important;
        }
        
        .status-dot {
            width: 8px !important;
            height: 8px !important;
            border-radius: 50% !important;
            margin-right: 8px !important;
            background: #gray !important;
        }
        
        .status-dot.ready {
            background: #10b981 !important;
        }
        
        .status-dot.recording {
            background: #ef4444 !important;
            animation: pulse 1.5s infinite !important;
        }
        
        .status-dot.processing {
            background: #3b82f6 !important;
            animation: pulse 1s infinite !important;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .transmeet-languages {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            margin-bottom: 15px !important;
        }
        
        .transmeet-languages select {
            flex: 1 !important;
            padding: 6px !important;
            border: 1px solid #ddd !important;
            border-radius: 4px !important;
            font-size: 12px !important;
            background: white !important;
        }
        
        .lang-arrow {
            color: #666 !important;
            font-size: 16px !important;
        }
        
        .transmeet-info {
            padding: 10px !important;
            background: #f0f8ff !important;
            border-radius: 6px !important;
            margin-bottom: 10px !important;
            font-size: 12px !important;
            color: #0066cc !important;
        }
        
        .transmeet-subtitles {
            max-height: 250px !important;
            overflow-y: auto !important;
            border-top: 1px solid #eee !important;
            padding-top: 10px !important;
        }
        
        .transmeet-subtitle-item {
            margin-bottom: 12px !important;
            padding: 10px !important;
            background: #f8f9fa !important;
            border-radius: 6px !important;
            border-left: 3px solid #667eea !important;
        }
        
        .subtitle-time {
            font-size: 11px !important;
            color: #999 !important;
            margin-bottom: 5px !important;
        }
        
        .subtitle-original {
            font-size: 13px !important;
            color: #333 !important;
            margin-bottom: 5px !important;
            line-height: 1.4 !important;
        }
        
        .subtitle-translation {
            font-size: 13px !important;
            color: #667eea !important;
            font-weight: 500 !important;
            line-height: 1.4 !important;
        }
        
        .subtitle-interim {
            opacity: 0.7 !important;
            font-style: italic !important;
        }
    `;
    document.head.appendChild(style);
}

// 设置事件监听器
function setupEventListeners() {
    // 关闭按钮
    document.getElementById('transmeet-close')?.addEventListener('click', () => {
        stopCapture();
        floatingWindow.remove();
        floatingWindow = null;
        settings.showFloating = false;
        saveSettings();
    });
    
    // 最小化按钮
    document.getElementById('transmeet-minimize')?.addEventListener('click', () => {
        const content = floatingWindow.querySelector('.transmeet-content');
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
    });
    
    // 捕获标签页音频按钮
    document.getElementById('transmeet-capture-tab')?.addEventListener('click', () => {
        startTabAudioCapture();
    });
    
    // 捕获麦克风按钮
    document.getElementById('transmeet-capture-mic')?.addEventListener('click', () => {
        startMicrophoneCapture();
    });
    
    // 停止捕获按钮
    document.getElementById('transmeet-stop-capture')?.addEventListener('click', () => {
        stopCapture();
    });
    
    // 语言切换
    document.getElementById('transmeet-source-lang')?.addEventListener('change', (e) => {
        settings.sourceLang = e.target.value;
        saveSettings();
        // 如果正在识别，更新语言
        if (recognition) {
            recognition.lang = getRecognitionLang(e.target.value);
        }
    });
    
    document.getElementById('transmeet-target-lang')?.addEventListener('change', (e) => {
        settings.targetLang = e.target.value;
        saveSettings();
    });
}

// 开始捕获标签页音频
async function startTabAudioCapture() {
    try {
        updateStatus('正在请求音频权限...', 'processing');
        
        // 使用屏幕共享API获取音频
        // 注意：这会显示一个选择窗口让用户选择要捕获的内容
        const stream = await navigator.mediaDevices.getDisplayMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                sampleRate: 44100
            },
            video: {
                width: { max: 1 },
                height: { max: 1 }
            } // 请求最小的视频以节省资源
        });
        
        // 停止视频轨道，只保留音频
        const videoTracks = stream.getVideoTracks();
        videoTracks.forEach(track => track.stop());
        
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
            throw new Error('未能获取音频。请确保在分享时勾选"分享音频"选项。');
        }
        
        mediaStream = stream;
        isCapturing = true;
        startRecognition('tab');
        
        // 更新UI
        if (document.getElementById('transmeet-capture-tab')) {
            document.getElementById('transmeet-capture-tab').style.display = 'none';
            document.getElementById('transmeet-capture-mic').style.display = 'none';
            document.getElementById('transmeet-stop-capture').style.display = 'block';
        }
        
        updateStatus('正在监听标签页音频...', 'recording');
        return { success: true };
        
    } catch (error) {
        console.error('Tab audio capture error:', error);
        updateStatus('音频捕获失败: ' + error.message, 'ready');
        throw error;
    }
}

// 开始捕获麦克风
async function startMicrophoneCapture() {
    try {
        updateStatus('正在请求麦克风权限...', 'processing');
        
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            }
        });
        
        mediaStream = stream;
        isCapturing = true;
        startRecognition('mic');
        
        // 更新UI
        if (document.getElementById('transmeet-capture-tab')) {
            document.getElementById('transmeet-capture-tab').style.display = 'none';
            document.getElementById('transmeet-capture-mic').style.display = 'none';
            document.getElementById('transmeet-stop-capture').style.display = 'block';
        }
        
        updateStatus('正在监听麦克风...', 'recording');
        return { success: true };
        
    } catch (error) {
        console.error('Microphone capture error:', error);
        updateStatus('麦克风捕获失败: ' + error.message, 'ready');
        throw error;
    }
}

// 开始语音识别
function startRecognition(mode) {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        updateStatus('浏览器不支持语音识别', 'ready');
        return;
    }
    
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = getRecognitionLang(settings.sourceLang);
    
    recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                // 最终结果
                handleTranscript(transcript, true);
            } else {
                // 临时结果
                handleTranscript(transcript, false);
            }
        }
    };
    
    recognition.onerror = (event) => {
        console.error('Recognition error:', event.error);
        if (event.error === 'no-speech') {
            // 继续监听
        } else {
            updateStatus('识别错误: ' + event.error, 'ready');
        }
    };
    
    recognition.onend = () => {
        // 如果还在捕获，自动重启
        if (isCapturing) {
            setTimeout(() => {
                try {
                    recognition.start();
                } catch (e) {
                    console.log('Restarting recognition...');
                }
            }, 100);
        }
    };
    
    try {
        recognition.start();
        isCapturing = true;
        console.log('Speech recognition started');
    } catch (e) {
        console.error('Failed to start recognition:', e);
    }
}

// 停止捕获
function stopCapture() {
    isCapturing = false;
    
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
    
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    
    // 恢复UI
    if (document.getElementById('transmeet-capture-tab')) {
        document.getElementById('transmeet-capture-tab').style.display = 'block';
        document.getElementById('transmeet-capture-mic').style.display = 'block';
        document.getElementById('transmeet-stop-capture').style.display = 'none';
    }
    
    updateStatus('准备就绪', 'ready');
}

// 处理转录文本
let lastTranscript = '';
let interimSubtitleId = null;

async function handleTranscript(text, isFinal) {
    if (!text || text === lastTranscript) return;
    
    if (isFinal) {
        lastTranscript = text;
        interimSubtitleId = null;
        
        // 添加到字幕
        const subtitleId = addSubtitle(text, '', isFinal);
        
        // 翻译
        if (settings.autoTranslate) {
            translateText(text, subtitleId);
        }
    } else {
        // 显示临时结果
        if (interimSubtitleId) {
            updateSubtitle(interimSubtitleId, text, '', false);
        } else {
            interimSubtitleId = addSubtitle(text, '', false);
        }
    }
}

// 添加字幕
let subtitleCounter = 0;
function addSubtitle(original, translation, isFinal = true) {
    const container = document.getElementById('transmeet-subtitles');
    if (!container) return;
    
    const subtitleId = 'subtitle-' + (++subtitleCounter);
    const timestamp = new Date().toLocaleTimeString();
    
    const subtitleItem = document.createElement('div');
    subtitleItem.id = subtitleId;
    subtitleItem.className = 'transmeet-subtitle-item' + (isFinal ? '' : ' subtitle-interim');
    subtitleItem.innerHTML = `
        <div class="subtitle-time">${timestamp}</div>
        <div class="subtitle-original">${original}</div>
        <div class="subtitle-translation">${translation || (isFinal ? '翻译中...' : '')}</div>
    `;
    
    container.insertBefore(subtitleItem, container.firstChild);
    
    // 限制显示数量
    while (container.children.length > 20) {
        container.removeChild(container.lastChild);
    }
    
    return subtitleId;
}

// 更新字幕
function updateSubtitle(subtitleId, original, translation, isFinal = true) {
    const subtitleEl = document.getElementById(subtitleId);
    if (!subtitleEl) return;
    
    if (!isFinal) {
        subtitleEl.classList.add('subtitle-interim');
    } else {
        subtitleEl.classList.remove('subtitle-interim');
    }
    
    const originalEl = subtitleEl.querySelector('.subtitle-original');
    const translationEl = subtitleEl.querySelector('.subtitle-translation');
    
    if (originalEl) originalEl.textContent = original;
    if (translationEl) translationEl.textContent = translation || (isFinal ? '翻译中...' : '');
}

// 翻译文本
async function translateText(text, subtitleId) {
    if (isTranslating) return;
    
    isTranslating = true;
    
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'translate',
            text: text,
            sourceLang: settings.sourceLang,
            targetLang: settings.targetLang,
            service: settings.translationService,
            apiKey: settings.apiKey
        });
        
        if (response.translation && subtitleId) {
            const subtitleEl = document.getElementById(subtitleId);
            if (subtitleEl) {
                const translationEl = subtitleEl.querySelector('.subtitle-translation');
                if (translationEl) {
                    translationEl.textContent = response.translation;
                }
            }
        }
    } catch (error) {
        console.error('Translation error:', error);
    } finally {
        isTranslating = false;
    }
}

// 获取语音识别语言代码
function getRecognitionLang(lang) {
    const langMap = {
        'auto': navigator.language || 'en-US',
        'zh-CN': 'zh-CN',
        'zh-TW': 'zh-TW',
        'en-US': 'en-US',
        'ja-JP': 'ja-JP',
        'ko-KR': 'ko-KR',
        'es-ES': 'es-ES',
        'fr-FR': 'fr-FR',
        'de-DE': 'de-DE',
        'ru-RU': 'ru-RU'
    };
    return langMap[lang] || lang;
}

// 更新状态
function updateStatus(text, state = 'ready') {
    const statusText = document.getElementById('transmeet-status-text');
    const statusDot = document.getElementById('status-dot');
    
    if (statusText) statusText.textContent = text;
    if (statusDot) {
        statusDot.className = 'status-dot ' + state;
    }
}

// 保存设置
function saveSettings() {
    chrome.storage.sync.set({ settings: settings });
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

// 处理来自background和popup的消息
function handleMessage(request, sender, sendResponse) {
    if (request.action === 'videoSiteDetected') {
        console.log('Video site detected:', request.url);
        // 可以根据网站类型自动调整设置
        sendResponse({ success: true });
    } else if (request.action === 'updateSettings') {
        settings = request.settings;
        if (floatingWindow) {
            document.getElementById('transmeet-source-lang').value = settings.sourceLang;
            document.getElementById('transmeet-target-lang').value = settings.targetLang;
        }
        sendResponse({ success: true });
    } else if (request.action === 'ping') {
        // 响应popup的ping请求，确认content script已加载
        sendResponse({ success: true });
    } else if (request.action === 'getCaptureStatus') {
        // 返回当前捕获状态
        sendResponse({ 
            isCapturing: isCapturing,
            captureMode: isCapturing ? (mediaStream && mediaStream.getAudioTracks()[0]?.label.includes('Microphone') ? 'mic' : 'tab') : null
        });
    } else if (request.action === 'startCapture') {
        // 从popup启动捕获
        if (!floatingWindow) {
            createFloatingWindow();
        }
        
        // 根据模式启动不同的捕获
        if (request.mode === 'tab') {
            startTabAudioCapture().then(() => {
                sendResponse({ success: true });
            }).catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        } else if (request.mode === 'mic') {
            startMicrophoneCapture().then(() => {
                sendResponse({ success: true });
            }).catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        }
        return true; // 保持消息通道开放以支持异步响应
    } else if (request.action === 'stopCapture') {
        // 停止捕获
        stopCapture();
        sendResponse({ success: true });
    }
    
    return true; // 保持消息通道开放
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('TransMeet content script loaded and ready');