// TransMeet Chrome Extension - Popup Script

// 加载设置
document.addEventListener('DOMContentLoaded', function() {
    loadSettings();
    loadStatistics();
    setupEventListeners();
});

function loadSettings() {
    chrome.storage.sync.get(['settings'], function(result) {
        const settings = result.settings || {
            enabled: true,
            sourceLang: 'zh-CN',
            targetLang: 'en-US',
            autoTranslate: true,
            showFloating: true,
            translationService: 'demo',
            apiKey: ''
        };
        
        // 更新UI
        document.getElementById('enableTranslation').checked = settings.enabled;
        document.getElementById('showFloating').checked = settings.showFloating;
        document.getElementById('autoTranslate').checked = settings.autoTranslate;
        document.getElementById('sourceLang').value = settings.sourceLang;
        document.getElementById('targetLang').value = settings.targetLang;
        document.getElementById('translationService').value = settings.translationService;
        
        if (settings.apiKey) {
            document.getElementById('apiKey').value = settings.apiKey;
        }
        
        // 显示/隐藏API密钥输入
        updateApiKeyVisibility(settings.translationService);
    });
}

function loadStatistics() {
    chrome.storage.local.get(['statistics'], function(result) {
        const stats = result.statistics || {
            todayCount: 0,
            totalTime: 0
        };
        
        document.getElementById('translationCount').textContent = stats.todayCount;
        document.getElementById('savedTime').textContent = Math.round(stats.totalTime / 60);
    });
}

function setupEventListeners() {
    // 开关控制
    document.getElementById('enableTranslation').addEventListener('change', saveSettings);
    document.getElementById('showFloating').addEventListener('change', saveSettings);
    document.getElementById('autoTranslate').addEventListener('change', saveSettings);
    
    // 语言选择
    document.getElementById('sourceLang').addEventListener('change', saveSettings);
    document.getElementById('targetLang').addEventListener('change', saveSettings);
    
    // 交换语言
    document.getElementById('swapLanguages').addEventListener('click', function() {
        const sourceLang = document.getElementById('sourceLang');
        const targetLang = document.getElementById('targetLang');
        const temp = sourceLang.value;
        sourceLang.value = targetLang.value;
        targetLang.value = temp;
        saveSettings();
    });
    
    // 翻译服务
    document.getElementById('translationService').addEventListener('change', function(e) {
        updateApiKeyVisibility(e.target.value);
        saveSettings();
    });
    
    // API密钥
    document.getElementById('apiKey').addEventListener('blur', saveSettings);
    
    // 显示/隐藏API密钥
    document.getElementById('showApiKey').addEventListener('click', function() {
        const apiKeyInput = document.getElementById('apiKey');
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            this.textContent = '🙈';
        } else {
            apiKeyInput.type = 'password';
            this.textContent = '👁';
        }
    });
    
    // 快捷操作
    document.getElementById('openSettings').addEventListener('click', function() {
        chrome.tabs.create({ url: chrome.runtime.getURL('../pages/settings.html') });
    });
    
    document.getElementById('viewHistory').addEventListener('click', function() {
        chrome.tabs.create({ url: chrome.runtime.getURL('../pages/history.html') });
    });
    
    document.getElementById('clearCache').addEventListener('click', function() {
        if (confirm('确定要清除所有缓存数据吗？')) {
            chrome.storage.local.clear(function() {
                alert('缓存已清除');
                loadStatistics();
            });
        }
    });
    
    // 帮助和反馈链接
    document.getElementById('helpLink').addEventListener('click', function(e) {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://github.com/0xFredZhang/transmeet/wiki' });
    });
    
    document.getElementById('feedbackLink').addEventListener('click', function(e) {
        e.preventDefault();
        chrome.tabs.create({ url: 'https://github.com/0xFredZhang/transmeet/issues' });
    });
}

function updateApiKeyVisibility(service) {
    const apiKeyInput = document.getElementById('apiKeyInput');
    if (service === 'demo') {
        apiKeyInput.style.display = 'none';
    } else {
        apiKeyInput.style.display = 'block';
    }
}

function saveSettings() {
    const settings = {
        enabled: document.getElementById('enableTranslation').checked,
        showFloating: document.getElementById('showFloating').checked,
        autoTranslate: document.getElementById('autoTranslate').checked,
        sourceLang: document.getElementById('sourceLang').value,
        targetLang: document.getElementById('targetLang').value,
        translationService: document.getElementById('translationService').value,
        apiKey: document.getElementById('apiKey').value
    };
    
    chrome.storage.sync.set({ settings: settings }, function() {
        // 通知content script更新设置
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs[0] && tabs[0].url && tabs[0].url.includes('meet.google.com')) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'updateSettings',
                    settings: settings
                });
            }
        });
        
        // 显示保存成功提示
        showToast('设置已保存');
    });
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 2000);
}