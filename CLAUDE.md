# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TransMeet is a pure frontend real-time bidirectional meeting translation system designed for Google Meet and similar platforms. The entire application runs in the browser without requiring any backend services.

## Running the Application

### Local Development
```bash
# No build process required - pure static files
# Simply open the HTML file in a browser:
open pages/index.html

# Or use a local server (if you have Python installed):
python3 -m http.server 8080
# Then navigate to http://localhost:8080/pages/index.html
```

### Chrome Extension Installation
```bash
# 1. Open Chrome and navigate to:
chrome://extensions/

# 2. Enable Developer Mode
# 3. Click "Load unpacked"
# 4. Select the /extension folder
```

## Core Architecture

### Translation Pipeline
The system implements a complete ASR → MT → TTS pipeline:

1. **Audio Input** (`meeting.html`)
   - Microphone capture for user speech
   - System audio capture via screen sharing API (experimental)
   - Manual text input for testing

2. **Speech Recognition** (`app.js: recognizeSpeechCloud()`)
   - Primary: Web Speech API (browser native)
   - Fallback: Cloud APIs (Whisper, Google STT)

3. **Translation** (`app.js: translateText()`)
   - Service router supporting multiple providers
   - Each service has dedicated function: `translateWith[Service]()`
   - Demo mode for testing without API keys

4. **Display & TTS** (`meeting.html: addSubtitle()`, `app.js: speakText()`)
   - Real-time subtitle rendering
   - Async translation updates
   - Optional TTS playback

### Data Storage Pattern
All data stored in LocalStorage with specific keys:
- `transmeet_settings`: User configuration and API keys
- `transmeet_history`: Translation history array

### API Key Management
Different services require different credentials:
- **Demo mode**: No credentials needed
- **AWS**: Requires `awsAccessKeyId`, `awsSecretAccessKey`, `awsRegion`
- **Others**: Standard `apiKey` field

## Key Implementation Details

### System Audio Capture Challenge
Web Speech API cannot directly process system audio streams. Current implementation:
- Uses `getDisplayMedia()` with screen sharing
- Provides fallback via manual subtitle input
- Auto-simulation mode for testing

### Auto-restart Mechanism
Speech recognition automatically restarts on interruption:
```javascript
systemRecognition.onend = () => {
    if (systemAudioStream) {
        setTimeout(() => { systemRecognition.start(); }, 100);
    }
};
```

### Subtitle Update Pattern
Avoids duplicates by checking existing subtitles:
```javascript
const existingSubtitle = Array.from(subtitles.children).find(el => {
    const originalText = el.querySelector('.subtitle-original')?.textContent;
    return originalText === text;
});
```

## Adding New Translation Services

1. Add translation function in `app.js`:
```javascript
async function translateWithYourService(text, sourceLang, targetLang, settings) {
    // Implementation
}
```

2. Add case in `translateText()` switch statement

3. Update `settings.html` and `popup.html` with new service option

4. Handle credentials in `meeting.html` `processTranslation()`:
```javascript
if (settings.translationService === 'yourservice') {
    // Check for required credentials
}
```

## Testing Translation Features

### Quick Test Flow
1. Open `pages/meeting.html`
2. Click "自动模拟" (Auto Simulation) button
3. Observe bilingual subtitles appearing every 3 seconds

### Manual Testing
1. Use "模拟字幕输入" (Simulate Subtitle Input) textarea
2. Enter test text and click "发送字幕"
3. Verify translation appears in subtitle area

## Chrome Extension Context

The extension operates in three contexts:
- **background.js**: Service worker handling API calls
- **content.js**: Injects into meet.google.com pages
- **popup.html/js**: Configuration interface

Extension cannot directly capture Meet subtitles due to DOM isolation, uses simulation for testing.

## Common Issues and Solutions

### "请先配置API密钥" Error
- Demo mode should not require API keys
- AWS requires specific credentials (not general apiKey)
- Check `processTranslation()` in meeting.html for credential logic

### System Audio Not Captured
- Browser limitation: Web Speech API designed for microphone
- User must check "Share system audio" during screen share
- Fallback to manual input or auto-simulation

### Subtitle Not Displaying
- Check `handleSystemAudioResult()` for immediate display logic
- Verify `addSubtitle()` is called with recognized text
- Ensure translation updates existing subtitle rather than creating duplicate