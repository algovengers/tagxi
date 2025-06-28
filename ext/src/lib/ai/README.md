# AI Content Scanner

This module provides AI-powered content analysis for the TagXi extension using Xenova Transformers.

## Features

- **Zero-shot Classification**: Uses DistilBERT to classify page content
- **Smart Element Detection**: Identifies important, notable, and actionable content
- **XPath Integration**: Generates precise XPaths for highlighted elements
- **Keyboard Shortcuts**: Ctrl+K to scan, Escape to clear
- **Visual Indicators**: Highlights suggested elements with confidence scores

## Usage

### Keyboard Shortcuts
- `Ctrl+K` (or `Cmd+K` on Mac): Trigger AI scan
- `Escape`: Clear AI highlights

### How it Works

1. **Page Scanning**: Analyzes text content from various HTML elements
2. **AI Classification**: Uses zero-shot classification to identify important content
3. **Smart Filtering**: Only highlights content above confidence threshold (70%)
4. **Visual Feedback**: Shows dashed outlines and AI indicators
5. **Quick Tagging**: Click AI indicators for instant tagging

### Classification Labels

The AI classifies content into these categories:
- `important information`: Critical content worth tagging
- `notable content`: Interesting but less critical content  
- `actionable item`: Content requiring user action
- `key insight`: Important insights or conclusions
- `skip`: Content not worth tagging

### Technical Details

- **Model**: `Xenova/distilbert-base-uncased-mnli`
- **Confidence Threshold**: 70% (configurable)
- **Batch Processing**: Processes elements in batches of 10
- **Performance**: Non-blocking with progressive loading
- **Memory**: Efficient model caching and cleanup

## Integration

The AI scanner integrates with:
- User settings (tag color preferences)
- Existing XPath utilities
- Toast notification system
- Background messaging system

## Browser Compatibility

- Chrome/Chromium: Full support
- Firefox: Full support  
- Safari: Limited (WebAssembly required)
- Edge: Full support

## Performance Notes

- First scan may take 2-3 seconds (model loading)
- Subsequent scans are much faster (model cached)
- Processes 10 elements per batch to avoid blocking
- Automatically skips hidden/irrelevant elements