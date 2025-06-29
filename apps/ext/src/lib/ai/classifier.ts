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
 * Load the zero-shot classifier model once with enhanced caching
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
    
    // Use zero-shot classification for better content analysis
    classifier = await pipeline(
      "zero-shot-classification",
      "Xenova/distilbert-base-uncased-mnli",
      {
        // Configure for browser environment with IndexedDB caching
        device: 'webgpu',
        dtype: 'fp16',
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
        "zero-shot-classification",
        "Xenova/distilbert-base-uncased-mnli",
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
      throw new Error(`Failed to load AI classifier: ${fallbackError.message}`)
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
 * Classify text content using the loaded model with enhanced labels
 */
export async function classifyContent(
  text: string,
  labels: string[] = [
    "important information",
    "notable content", 
    "actionable item",
    "key insight",
    "educational content",
    "news or update",
    "technical documentation",
    "user interface element",
    "advertisement",
    "navigation element",
    "skip"
  ]
) {
  try {
    const model = await loadClassifier()
    const result = await model(text, labels)
    return result
  } catch (error) {
    console.error("❌ Classification failed:", error)
    // Return a fallback classification using enhanced rule-based approach
    return fallbackClassifier(text, labels)
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
  
  // Define which labels are considered taggable
  const taggableLabels = [
    "important information",
    "notable content", 
    "actionable item",
    "key insight",
    "educational content",
    "news or update",
    "technical documentation"
  ]
  
  return taggableLabels.includes(topLabel) && topScore > threshold
}

/**
 * Enhanced rule-based fallback classifier for when AI fails
 */
export function fallbackClassifier(text: string, labels: string[]): { labels: string[], scores: number[] } {
  const importantKeywords = [
    'important', 'critical', 'urgent', 'breaking', 'alert',
    'announcement', 'update', 'new', 'release', 'launch',
    'warning', 'error', 'issue', 'problem', 'fix',
    'security', 'vulnerability', 'patch', 'hotfix',
    'deadline', 'required', 'mandatory', 'must'
  ]
  
  const notableKeywords = [
    'interesting', 'note', 'tip', 'advice', 'guide',
    'tutorial', 'how to', 'learn', 'discover', 'feature',
    'improvement', 'enhancement', 'optimization', 'performance',
    'best practice', 'recommendation', 'suggestion',
    'insight', 'analysis', 'research', 'study'
  ]
  
  const actionableKeywords = [
    'click', 'download', 'install', 'configure', 'setup',
    'follow', 'complete', 'submit', 'register', 'sign up',
    'login', 'verify', 'confirm', 'activate', 'enable',
    'disable', 'delete', 'remove', 'add', 'create'
  ]
  
  const educationalKeywords = [
    'explain', 'definition', 'concept', 'theory', 'principle',
    'example', 'demonstration', 'illustration', 'case study',
    'lesson', 'course', 'training', 'workshop', 'seminar'
  ]
  
  const newsKeywords = [
    'today', 'yesterday', 'recently', 'latest', 'current',
    'trending', 'popular', 'viral', 'happening', 'event',
    'conference', 'meeting', 'announcement', 'press release'
  ]
  
  const skipKeywords = [
    'advertisement', 'ad', 'sponsored', 'promotion', 'sale',
    'cookie', 'privacy policy', 'terms of service', 'legal',
    'footer', 'header', 'navigation', 'menu', 'sidebar',
    'breadcrumb', 'pagination', 'loading', 'placeholder'
  ]
  
  const lowerText = text.toLowerCase()
  
  // Calculate keyword matches
  const importantMatches = importantKeywords.filter(keyword => 
    lowerText.includes(keyword)
  ).length
  
  const notableMatches = notableKeywords.filter(keyword => 
    lowerText.includes(keyword)
  ).length
  
  const actionableMatches = actionableKeywords.filter(keyword => 
    lowerText.includes(keyword)
  ).length
  
  const educationalMatches = educationalKeywords.filter(keyword => 
    lowerText.includes(keyword)
  ).length
  
  const newsMatches = newsKeywords.filter(keyword => 
    lowerText.includes(keyword)
  ).length
  
  const skipMatches = skipKeywords.filter(keyword => 
    lowerText.includes(keyword)
  ).length
  
  // Check text characteristics
  const hasNumbers = /\d/.test(text)
  const hasCapitalization = /[A-Z]{2,}/.test(text)
  const hasExclamation = /[!?]/.test(text)
  const hasCodeSyntax = /[{}[\]();]/.test(text)
  const hasUrls = /https?:\/\//.test(text)
  const isShort = text.length < 50
  const isLong = text.length > 200
  
  // Calculate base scores
  let scores = {
    "important information": Math.min(0.9, 0.2 + (importantMatches * 0.15)),
    "notable content": Math.min(0.8, 0.15 + (notableMatches * 0.12)),
    "actionable item": Math.min(0.8, 0.1 + (actionableMatches * 0.15)),
    "key insight": Math.min(0.7, 0.1 + (notableMatches * 0.1) + (educationalMatches * 0.1)),
    "educational content": Math.min(0.8, 0.1 + (educationalMatches * 0.15)),
    "news or update": Math.min(0.7, 0.1 + (newsMatches * 0.12)),
    "technical documentation": Math.min(0.7, 0.05 + (hasCodeSyntax ? 0.2 : 0)),
    "user interface element": Math.min(0.6, 0.05 + (actionableMatches * 0.05)),
    "advertisement": Math.min(0.9, skipMatches * 0.2),
    "navigation element": Math.min(0.8, skipMatches * 0.15),
    "skip": Math.min(0.9, 0.1 + (skipMatches * 0.2))
  }
  
  // Adjust scores based on text characteristics
  if (hasExclamation || hasCapitalization) {
    scores["important information"] += 0.1
    scores["news or update"] += 0.05
  }
  
  if (hasNumbers && !isLong) {
    scores["technical documentation"] += 0.1
    scores["actionable item"] += 0.05
  }
  
  if (hasCodeSyntax) {
    scores["technical documentation"] += 0.2
    scores["educational content"] += 0.1
  }
  
  if (hasUrls) {
    scores["actionable item"] += 0.1
    scores["notable content"] += 0.05
  }
  
  if (isShort && !hasExclamation) {
    // Reduce scores for very short text without emphasis
    Object.keys(scores).forEach(key => {
      if (key !== "skip" && key !== "user interface element") {
        scores[key] *= 0.7
      }
    })
  }
  
  if (isLong) {
    scores["educational content"] += 0.1
    scores["technical documentation"] += 0.05
  }
  
  // Normalize scores to ensure they sum to approximately 1
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0)
  if (totalScore > 0) {
    Object.keys(scores).forEach(key => {
      scores[key] = scores[key] / totalScore
    })
  }
  
  // Sort by score and return in the expected format
  const sortedEntries = Object.entries(scores).sort((a, b) => b[1] - a[1])
  
  return {
    labels: sortedEntries.map(([label]) => label),
    scores: sortedEntries.map(([, score]) => score)
  }
}