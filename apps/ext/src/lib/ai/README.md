# AI Content Scanner

This module provides AI-powered content analysis for the TagXi extension using Xenova Transformers.

## Features

- **Text Classification**: Uses DistilBERT for sentiment-based content analysis
- **Smart Element Detection**: Identifies important, notable, and actionable content
- **XPath Integration**: Generates precise XPaths for highlighted elements
- **Keyboard Shortcuts**: Ctrl+K to scan, Escape to clear
- **Visual Indicators**: Highlights suggested elements with confidence scores
- **Robust Fallback System**: Enhanced rule-based classification when AI models fail

## Usage

### Keyboard Shortcuts
- `Ctrl+K` (or `Cmd+K` on Mac): Trigger AI scan
- `Escape`: Clear AI highlights

### How it Works

1. **Page Scanning**: Analyzes text content from various HTML elements
2. **AI Classification**: Uses sentiment analysis adapted for content importance
3. **Fallback Classification**: Enhanced rule-based system with keyword matching
4. **Smart Filtering**: Only highlights content above confidence threshold (50%)
5. **Visual Feedback**: Shows dashed outlines and AI indicators
6. **Quick Tagging**: Click AI indicators for instant tagging

### Classification System

The system maps sentiment analysis to content importance:
- **Positive sentiment (>80%)** → Important content
- **Positive sentiment (>60%)** → Notable content  
- **Neutral/Negative sentiment** → Skip content

### Fallback Classification

When AI models aren't available, uses enhanced keyword matching:

**Important Keywords:**
- `important`, `critical`, `urgent`, `breaking`, `alert`
- `announcement`, `update`, `new`, `release`, `launch`
- `warning`, `error`, `issue`, `problem`, `fix`
- `security`, `vulnerability`, `patch`, `hotfix`

**Notable Keywords:**
- `interesting`, `note`, `tip`, `advice`, `guide`
- `tutorial`, `how to`, `learn`, `discover`, `feature`
- `improvement`, `enhancement`, `optimization`
- `best practice`, `recommendation`, `suggestion`

**Skip Keywords:**
- `advertisement`, `ad`, `sponsored`, `promotion`
- `cookie`, `privacy policy`, `terms of service`
- `footer`, `header`, `navigation`, `menu`

### Technical Details

- **Model**: `Xenova/distilbert-base-uncased-finetuned-sst-2-english`
- **Confidence Threshold**: 50% (configurable)
- **Batch Processing**: Processes elements in batches of 3
- **Element Limit**: Maximum 30 elements per scan for performance
- **Performance**: Non-blocking with progressive loading
- **Memory**: Efficient model caching and cleanup

## Model Selection

### Primary Model
- **DistilBERT SST-2**: Lightweight sentiment analysis model
- **Size**: ~67MB (much smaller than zero-shot models)
- **Speed**: Fast inference suitable for browser extensions
- **Reliability**: Well-tested and stable

### Fallback Strategy
1. **WebGPU** → **CPU** → **Sentiment Analysis** → **Rule-based**
2. Graceful degradation ensures extension always works
3. Clear user feedback about which mode is active

## Performance Optimizations

### Model Loading
- Uses smaller, more reliable sentiment analysis model
- Automatic fallback to CPU if WebGPU fails
- Caches models in browser for subsequent uses

### Content Processing
- Limits analysis to 30 most relevant elements
- Processes in small batches (3 elements) to prevent blocking
- Skips hidden, irrelevant, or advertisement content
- Optimized text length filtering (10-300 characters)

### Error Handling
- Comprehensive fallback system
- Automatic mode switching on AI failure
- Clear user feedback about analysis mode
- No blocking errors - always provides results

## Browser Compatibility

- **Chrome/Chromium**: Full support with WebGPU acceleration
- **Firefox**: Full support with CPU fallback
- **Safari**: Limited (requires WebAssembly support)
- **Edge**: Full support

## Integration

The AI scanner integrates with:
- User settings (tag color preferences)
- Existing XPath utilities  
- Toast notification system
- Background messaging system
- Blocked websites functionality
- Content script highlighting system

## Troubleshooting

### Model Loading Issues
- Extension automatically falls back to rule-based analysis
- No user intervention required
- Clear feedback about which mode is active

### Poor Results
- AI models may still be loading (first use)
- Rule-based fallback provides basic functionality
- Try again after a few moments for full AI features

### Performance Issues
- Reduced batch size and element limits
- Automatic timeout and fallback systems
- Non-blocking processing prevents browser freezing

## Future Improvements

- **Custom Model Training**: Train on web content specifically
- **User Feedback Loop**: Learn from user tagging patterns
- **Context Awareness**: Consider page type and domain
- **Performance Metrics**: Track and optimize classification accuracy