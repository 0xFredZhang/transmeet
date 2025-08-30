// TransMeet Chrome Extension - Popup Script

let isCapturing = false;
let captureMode = null;

document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    setupEventListeners();
    checkCaptureStatus();
});

// 检查当前捕获状态
function checkCaptureStatus() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'getCaptureStatus' }, function(response) {
                if (chrome.runtime.lastError) {
                    // Content script might not be loaded
                    updateStatus('未捕获音频', false);
                } else if (response && response.isCapturing) {
                    isCapturing = true;
                    captureMode = response.captureMode;
                    updateStatus(`正在捕获${captureMode === 'mic' ? '麦克风' : '标签页音频'}`, true);
                    document.getElementById('stopCapture').style.display = 'block';
                } else {
                    updateStatus('未捕获音频', false);
                }
            });
        }
    });
}

function setupEventListeners() {
    // 捕获标签页音频
    document.getElementById('captureTab').addEventListener('click', function() {
        if (isCapturing) {
            alert('已经在捕获中，请先停止当前捕获');
            return;
        }
        startTabCapture();
    });
    
    // 捕获麦克风
    document.getElementById('captureMic').addEventListener('click', function() {
        if (isCapturing) {
            alert('已经在捕获中，请先停止当前捕获');
            return;
        }
        startMicCapture();
    });
    
    // 停止捕获
    document.getElementById('stopCapture').addEventListener('click', function() {
        stopCapture();
    });
    
    // 语言设置
    document.getElementById('sourceLang').addEventListener('change', saveSettings);
    document.getElementById('targetLang').addEventListener('change', saveSettings);
    
    // 开关控制
    document.getElementById('autoTranslate').addEventListener('change', saveSettings);
    document.getElementById('showFloating').addEventListener('change', saveSettings);
    
    // 翻译服务
    document.getElementById('translationService').addEventListener('change', function(e) {
        const apiKeyInput = document.getElementById('apiKey');
        if (e.target.value === 'demo') {
            apiKeyInput.style.display = 'none';
        } else {
            apiKeyInput.style.display = 'block';
        }
        saveSettings();
    });
    
    // API密钥
    document.getElementById('apiKey').addEventListener('blur', saveSettings);
    
    // 打开设置页面
    document.getElementById('openSettings').addEventListener('click', function() {
        chrome.tabs.create({ url: chrome.runtime.getURL('pages/settings.html') });
    });
    
    // 查看历史
    document.getElementById('viewHistory').addEventListener('click', function() {
        chrome.tabs.create({ url: chrome.runtime.getURL('pages/history.html') });
    });
}

// 开始捕获标签页音频
function startTabCapture() {
    chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
        if (!tabs[0]) return;
        
        const tab = tabs[0];
        
        // 检查是否已经注入了content script
        chrome.tabs.sendMessage(tab.id, { action: 'ping' }, function(response) {
            if (chrome.runtime.lastError) {
                // 需要注入content script
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                }, function() {
                    if (chrome.runtime.lastError) {
                        alert('无法在此页面上运行扩展');
                        return;
                    }
                    // 等待content script加载完成
                    setTimeout(() => {
                        sendStartCaptureMessage(tab.id, 'tab');
                    }, 500);
                });
            } else {
                // Content script已存在，直接发送消息
                sendStartCaptureMessage(tab.id, 'tab');
            }
        });
    });
}

// 开始捕获麦克风
function startMicCapture() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (!tabs[0]) return;
        
        const tab = tabs[0];
        
        // 检查是否已经注入了content script
        chrome.tabs.sendMessage(tab.id, { action: 'ping' }, function(response) {
            if (chrome.runtime.lastError) {
                // 需要注入content script
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                }, function() {
                    if (chrome.runtime.lastError) {
                        alert('无法在此页面上运行扩展');
                        return;
                    }
                    // 等待content script加载完成
                    setTimeout(() => {
                        sendStartCaptureMessage(tab.id, 'mic');
                    }, 500);
                });
            } else {
                // Content script已存在，直接发送消息
                sendStartCaptureMessage(tab.id, 'mic');
            }
        });
    });
}

// 发送开始捕获消息
function sendStartCaptureMessage(tabId, mode) {
    chrome.tabs.sendMessage(tabId, { 
        action: 'startCapture',
        mode: mode
    }, function(response) {
        if (chrome.runtime.lastError) {
            alert('发送消息失败: ' + chrome.runtime.lastError.message);
            return;
        }
        
        if (response && response.success) {
            isCapturing = true;
            captureMode = mode;
            updateStatus(`正在捕获${mode === 'mic' ? '麦克风' : '标签页音频'}`, true);
            document.getElementById('stopCapture').style.display = 'block';
            
            // 可以关闭popup窗口
            setTimeout(() => {
                window.close();
            }, 1000);
        } else {
            alert('开始捕获失败: ' + (response ? response.error : '未知错误'));
        }
    });
}

// 停止捕获
function stopCapture() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'stopCapture' }, function(response) {
                if (response && response.success) {
                    isCapturing = false;
                    captureMode = null;
                    updateStatus('未捕获音频', false);
                    document.getElementById('stopCapture').style.display = 'none';
                }
            });
        }
    });
}

// 更新状态显示
function updateStatus(text, capturing) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    statusText.textContent = text;
    
    if (capturing) {
        statusDot.classList.add('recording');
    } else {
        statusDot.classList.remove('recording');
    }
}

// 加载设置
function loadSettings() {
    chrome.storage.sync.get(['settings'], function(result) {
        const settings = result.settings || {
            sourceLang: 'zh-CN',
            targetLang: 'en-US',
            autoTranslate: true,
            showFloating: true,
            translationService: 'demo',
            apiKey: ''
        };
        
        // 更新UI
        document.getElementById('sourceLang').value = settings.sourceLang;
        document.getElementById('targetLang').value = settings.targetLang;
        document.getElementById('autoTranslate').checked = settings.autoTranslate;
        document.getElementById('showFloating').checked = settings.showFloating;
        document.getElementById('translationService').value = settings.translationService;
        
        if (settings.translationService !== 'demo') {
            document.getElementById('apiKey').style.display = 'block';
            document.getElementById('apiKey').value = settings.apiKey || '';
        }
    });
}

// 保存设置
function saveSettings() {
    const settings = {
        sourceLang: document.getElementById('sourceLang').value,
        targetLang: document.getElementById('targetLang').value,
        autoTranslate: document.getElementById('autoTranslate').checked,
        showFloating: document.getElementById('showFloating').checked,
        translationService: document.getElementById('translationService').value,
        apiKey: document.getElementById('apiKey').value
    };
    
    chrome.storage.sync.set({ settings: settings }, function() {
        // 通知所有标签页更新设置
        chrome.tabs.query({}, function(tabs) {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'updateSettings',
                    settings: settings
                }).catch(() => {
                    // Ignore errors for tabs without content script
                });
            });
        });
    });
}