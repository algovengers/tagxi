# AI Content Scanner

This module provides AI-powered content analysis for the TagXi extension using Xenova Transformers.

## Features

- **Zero-shot Classification**: Uses DistilBERT to classify page content
- **Smart Element Detection**: Identifies important, notable, and actionable content
- **XPath Integration**: Generates precise XPaths for highlighted elements
- **Keyboard Shortcuts**: Ctrl+K to scan, Escape to clear
- **Visual Indicators**: Highlights suggested elements with confidence scores
- **Fallback System**: Rule-based classification when AI models fail to load

## Usage

### Keyboard Shortcuts
- `Ctrl+K` (or `Cmd+K` on Mac): Trigger AI scan
- `Escape`: Clear AI highlights

### How it Works

1. **Page Scanning**: Analyzes text content from various HTML elements
2. **AI Classification**: Uses zero-shot classification to identify important content
3. **Fallback Classification**: Uses rule-based system if AI models aren't available
4. **Smart Filtering**: Only highlights content above confidence threshold (60%)
5. **Visual Feedback**: Shows dashed outlines and AI indicators
6. **Quick Tagging**: Click AI indicators for instant tagging

### Classification Labels

The AI classifies content into these categories:
- `important information`: Critical content worth tagging
- `notable content`: Interesting but less critical content  
- `actionable item`: Content requiring user action
- `key insight`: Important insights or conclusions
- `skip`: Content not worth tagging

### Technical Details

- **Model**: `Xenova/distilbert-base-uncased-mnli`
- **Confidence Threshold**: 60% (configurable)
- **Batch Processing**: Processes elements in batches of 5
- **Performance**: Non-blocking with progressive loading
- **Memory**: Efficient model caching and cleanup
- **Fallback**: Rule-based classification when AI fails

## Model Loading

### First Time Setup
- Models are downloaded automatically on first use
- Download happens in background, may take 30-60 seconds
- Subsequent uses are much faster (models cached)

### Fallback System
- If AI models fail to load, uses rule-based classification
- Looks for keywords like "important", "critical", "urgent"
- Provides basic content analysis without AI dependency

## Integration

The AI scanner integrates with:
- User settings (tag color preferences)
- Existing XPath utilities
- Toast notification system
- Background messaging system
- Blocked websites functionality

## Browser Compatibility

- Chrome/Chromium: Full support with WebGPU acceleration
- Firefox: Full support with CPU fallback
- Safari: Limited (WebAssembly required)
- Edge: Full support

## Performance Notes

- First scan may take 30-60 seconds (model downloading)
- Subsequent scans are much faster (models cached)
- Processes 5 elements per batch to avoid blocking
- Automatically skips hidden/irrelevant elements
- Graceful degradation to rule-based system if AI fails

## Troubleshooting

### "Models not found locally" Error
- This is normal on first use
- Models are downloading in background
- Try again after 30-60 seconds
- Extension will use rule-based fallback meanwhile

### Poor Classification Results
- AI models may still be loading
- Check browser console for loading progress
- Rule-based fallback provides basic functionality
- Full AI features available after models load