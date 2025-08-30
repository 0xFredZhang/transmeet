// Audio Processor for TransMeet
// 处理音频流并进行语音识别

class AudioProcessor {
    constructor() {
        this.mediaStream = null;
        this.audioContext = null;
        this.recognition = null;
        this.isProcessing = false;
        this.onTranscript = null;
    }

    // 初始化语音识别
    initRecognition(lang = 'zh-CN') {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            console.error('浏览器不支持语音识别');
            return false;
        }

        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = lang;
        
        this.recognition.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    if (this.onTranscript) {
                        this.onTranscript(transcript, true);
                    }
                } else {
                    if (this.onTranscript) {
                        this.onTranscript(transcript, false);
                    }
                }
            }
        };

        this.recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            if (event.error === 'no-speech' || event.error === 'audio-capture') {
                // 自动重启
                setTimeout(() => {
                    if (this.isProcessing) {
                        this.startRecognition();
                    }
                }, 1000);
            }
        };

        this.recognition.onend = () => {
            // 如果还在处理中，自动重启
            if (this.isProcessing) {
                setTimeout(() => {
                    this.startRecognition();
                }, 100);
            }
        };

        return true;
    }

    // 开始语音识别
    startRecognition() {
        if (this.recognition && !this.isProcessing) {
            try {
                this.recognition.start();
                this.isProcessing = true;
                console.log('语音识别已启动');
            } catch (e) {
                console.error('启动语音识别失败:', e);
            }
        }
    }

    // 停止语音识别
    stopRecognition() {
        if (this.recognition && this.isProcessing) {
            try {
                this.recognition.stop();
                this.isProcessing = false;
                console.log('语音识别已停止');
            } catch (e) {
                console.error('停止语音识别失败:', e);
            }
        }
    }

    // 设置音频流
    setMediaStream(stream) {
        this.mediaStream = stream;
        
        // 创建音频上下文
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = this.audioContext.createMediaStreamSource(stream);
        
        // 可以在这里添加音频处理节点
        // 例如：降噪、增益等
        
        console.log('音频流已设置');
    }

    // 清理资源
    cleanup() {
        this.stopRecognition();
        
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}

// 导出给内容脚本使用
window.AudioProcessor = AudioProcessor;