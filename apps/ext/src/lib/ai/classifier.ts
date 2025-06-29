import { pipeline, env } from "@xenova/transformers"

// Configure transformers for browser extension environment with IndexedDB caching
env.allowRemoteModels = true
env.allowLocalModels = true
env.useBrowserCache = true
env.cacheDir = 'tagxi-ai-models' // Custom cache directory in IndexedDB

let classifier: any = null
let isLoading = false

// Session-based model cache - persists until browser restart
let sessionModelCache: {
  model?: any
  timestamp: number
} = {
  timestamp: 0
}

/**
 * Load a lightweight classifier model suitable for browser extensions
 * Models are cached in IndexedDB and session memory for optimal performance
 */
export async function loadClassifier() {
  // Check session cache first (fastest)
  if (sessionModelCache.model) {
    console.log("⚡ AI Classifier: Using session cached model")
    return sessionModelCache.model
  }
  
  if (classifier) {
    sessionModelCache.model = classifier
    return classifier
  }
  
  if (isLoading) {
    // Wait for existing loading to complete
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return classifier || sessionModelCache.model
  }
  
  isLoading = true
  
  try {
    console.log("🤖 Loading AI classifier (will cache in IndexedDB)...")
    
    // Use a smaller, more reliable model that works better in browser extensions
    // This model is specifically designed for text classification and is smaller
    classifier = await pipeline(
      "text-classification",
      "Xenova/distilbert-base-uncased-finetuned-sst-2-english",
      {
        // Configure for browser environment with IndexedDB caching
        device: 'webgpu',
        dtype: 'fp32',
        cache_dir: env.cacheDir, // Use IndexedDB for persistent caching
        local_files_only: false, // Allow downloading if not cached
        use_cache: true // Enable caching
      }
    )
    
    // Cache in session for immediate reuse
    sessionModelCache.model = classifier
    sessionModelCache.timestamp = Date.now()
    
    console.log("✅ AI classifier loaded and cached successfully")
    return classifier
  } catch (error) {
    console.error("❌ Failed to load AI classifier:", error)
    
    // Try with CPU fallback
    try {
      console.log("🔄 Retrying with CPU fallback...")
      classifier = await pipeline(
        "text-classification",
        "Xenova/distilbert-base-uncased-finetuned-sst-2-english",
        {
          device: 'cpu',
          dtype: 'fp32',
          cache_dir: env.cacheDir,
          local_files_only: false,
          use_cache: true
        }
      )
      
      sessionModelCache.model = classifier
      sessionModelCache.timestamp = Date.now()
      
      console.log("✅ AI classifier loaded with CPU fallback and cached")
      return classifier
    } catch (fallbackError) {
      console.error("❌ CPU fallback also failed:", fallbackError)
      
      // Try an even simpler model as last resort
      try {
        console.log("🔄 Trying lightweight model as last resort...")
        classifier = await pipeline(
          "sentiment-analysis",
          "Xenova/distilbert-base-uncased-finetuned-sst-2-english",
          {
            cache_dir: env.cacheDir,
            local_files_only: false,
            use_cache: true
          }
        )
        
        sessionModelCache.model = classifier
        sessionModelCache.timestamp = Date.now()
        
        console.log("✅ Lightweight AI classifier loaded and cached")
        return classifier
      } catch (lastResortError) {
        console.error("❌ All AI models failed:", lastResortError)
        throw new Error(`Failed to load any AI classifier: ${lastResortError.message}`)
      }
    }
  } finally {
    isLoading = false
  }
}

/**
 * Clear model cache (useful for debugging or memory management)
 */
export function clearModelCache() {
  sessionModelCache = { timestamp: 0 }
  classifier = null
  console.log("🧹 AI model cache cleared")
}

/**
 * Get cache status for debugging
 */
export function getCacheStatus() {
  return {
    hasSessionCache: !!sessionModelCache.model,
    hasClassifier: !!classifier,
    cacheAge: sessionModelCache.timestamp ? Date.now() - sessionModelCache.timestamp : 0,
    cacheDir: env.cacheDir
  }
}

/**
 * Classify text content using the loaded model
 * Since we're using sentiment analysis, we'll adapt it for content importance
 */
export async function classifyContent(
  text: string,
  labels: string[] = ["important", "notable", "skip"]
) {
  try {
    const model = await loadClassifier()
    
    // Use sentiment analysis to determine content importance
    const result = await model(text)
    
    // Convert sentiment to importance classification
    const sentiment = result[0]
    const score = sentiment.score
    const label = sentiment.label
    
    // Map sentiment to our classification system
    if (label === "POSITIVE" && score > 0.8) {
      return {
        labels: ["important", "notable", "skip"],
        scores: [0.9, 0.08, 0.02]
      }
    } else if (label === "POSITIVE" && score > 0.6) {
      return {
        labels: ["notable", "important", "skip"],
        scores: [0.7, 0.2, 0.1]
      }
    } else {
      return {
        labels: ["skip", "notable", "important"],
        scores: [0.8, 0.15, 0.05]
      }
    }
  } catch (error) {
    console.error("❌ Classification failed:", error)
    // Return a fallback classification using rule-based approach
    return fallbackClassifier(text)
  }
}

/**
 * Check if content is worth tagging based on classification
 */
export function isTaggable(
  result: any,
  threshold: number = 0.6
): boolean {
  const topLabel = result.labels[0]
  const topScore = result.scores[0]
  
  return (
    (topLabel === "important" || topLabel === "notable") && 
    topScore > threshold
  )
}

/**
 * Enhanced rule-based fallback classifier for when AI fails
 */
export function fallbackClassifier(text: string): { labels: string[], scores: number[] } {
  const importantKeywords = [
    'important', 'critical', 'urgent', 'breaking', 'alert',
    'announcement', 'update', 'new', 'release', 'launch',
    'warning', 'error', 'issue', 'problem', 'fix',
    'security', 'vulnerability', 'patch', 'hotfix'
  ]
  
  const notableKeywords = [
    'interesting', 'note', 'tip', 'advice', 'guide',
    'tutorial', 'how to', 'learn', 'discover', 'feature',
    'improvement', 'enhancement', 'optimization', 'performance',
    'best practice', 'recommendation', 'suggestion'
  ]
  
  const skipKeywords = [
    'advertisement', 'ad', 'sponsored', 'promotion',
    'cookie', 'privacy policy', 'terms of service',
    'footer', 'header', 'navigation', 'menu'
  ]
  
  const lowerText = text.toLowerCase()
  
  // Check for skip keywords first
  const hasSkipKeywords = skipKeywords.some(keyword => 
    lowerText.includes(keyword)
  )
  
  if (hasSkipKeywords) {
    return {
      labels: ["skip", "notable", "important"],
      scores: [0.9, 0.07, 0.03]
    }
  }
  
  // Check for important keywords
  const importantMatches = importantKeywords.filter(keyword => 
    lowerText.includes(keyword)
  ).length
  
  // Check for notable keywords
  const notableMatches = notableKeywords.filter(keyword => 
    lowerText.includes(keyword)
  ).length
  
  // Calculate scores based on keyword matches
  const importantScore = Math.min(0.9, 0.3 + (importantMatches * 0.2))
  const notableScore = Math.min(0.8, 0.2 + (notableMatches * 0.15))
  
  // Check text characteristics
  const hasNumbers = /\d/.test(text)
  const hasCapitalization = /[A-Z]{2,}/.test(text)
  const hasExclamation = /[!?]/.test(text)
  const isShort = text.length < 50
  const isLong = text.length > 200
  
  // Adjust scores based on text characteristics
  let finalImportantScore = importantScore
  let finalNotableScore = notableScore
  
  if (hasExclamation || hasCapitalization) {
    finalImportantScore += 0.1
  }
  
  if (hasNumbers && !isLong) {
    finalNotableScore += 0.1
  }
  
  if (isShort && !hasExclamation) {
    finalImportantScore *= 0.7
    finalNotableScore *= 0.8
  }
  
  const skipScore = 1 - Math.max(finalImportantScore, finalNotableScore)
  
  // Return classification based on highest score
  if (finalImportantScore > finalNotableScore && finalImportantScore > skipScore) {
    return {
      labels: ["important", "notable", "skip"],
      scores: [finalImportantScore, finalNotableScore, skipScore]
    }
  } else if (finalNotableScore > skipScore) {
    return {
      labels: ["notable", "important", "skip"],
      scores: [finalNotableScore, finalImportantScore, skipScore]
    }
  } else {
    return {
      labels: ["skip", "notable", "important"],
      scores: [skipScore, finalNotableScore, finalImportantScore]
    }
  }
}