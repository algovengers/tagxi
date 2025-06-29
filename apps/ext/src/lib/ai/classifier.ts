import { pipeline, env } from "@xenova/transformers"

// Configure transformers to allow remote models for browser extension
env.allowRemoteModels = true
env.allowLocalModels = true

// Set custom cache directory for extension
env.cacheDir = './.cache'

let classifier: any = null
let isLoading = false

/**
 * Load the zero-shot classifier model once
 */
export async function loadClassifier() {
  if (classifier) {
    return classifier
  }
  
  if (isLoading) {
    // Wait for existing loading to complete
    while (isLoading) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return classifier
  }
  
  isLoading = true
  
  try {
    console.log("🤖 Loading AI classifier...")
    
    // Use a smaller, faster model that's more suitable for browser extensions
    classifier = await pipeline(
      "zero-shot-classification",
      "Xenova/distilbert-base-uncased-mnli",
      {
        // Configure for browser environment
        device: 'webgpu', // Try WebGPU first, fallback to CPU
        dtype: 'fp32'
      }
    )
    
    console.log("✅ AI classifier loaded successfully")
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
          dtype: 'fp32'
        }
      )
      console.log("✅ AI classifier loaded with CPU fallback")
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
 * Classify text content using the loaded model
 */
export async function classifyContent(
  text: string,
  labels: string[] = ["important", "notable", "skip"]
) {
  try {
    const model = await loadClassifier()
    return await model(text, labels)
  } catch (error) {
    console.error("❌ Classification failed:", error)
    // Return a fallback classification
    return {
      labels: ["skip", "important", "notable"],
      scores: [0.9, 0.05, 0.05] // Default to "skip" if AI fails
    }
  }
}

/**
 * Check if content is worth tagging based on classification
 */
export function isTaggable(
  result: any,
  threshold: number = 0.75
): boolean {
  const topLabel = result.labels[0]
  const topScore = result.scores[0]
  
  return (
    (topLabel === "important" || topLabel === "notable") && 
    topScore > threshold
  )
}

/**
 * Simple rule-based fallback classifier for when AI fails
 */
export function fallbackClassifier(text: string): { labels: string[], scores: number[] } {
  const importantKeywords = [
    'important', 'critical', 'urgent', 'breaking', 'alert',
    'announcement', 'update', 'new', 'release', 'launch'
  ]
  
  const notableKeywords = [
    'interesting', 'note', 'tip', 'advice', 'guide',
    'tutorial', 'how to', 'learn', 'discover'
  ]
  
  const lowerText = text.toLowerCase()
  
  const importantScore = importantKeywords.some(keyword => 
    lowerText.includes(keyword)
  ) ? 0.8 : 0.1
  
  const notableScore = notableKeywords.some(keyword => 
    lowerText.includes(keyword)
  ) ? 0.7 : 0.1
  
  const skipScore = 1 - Math.max(importantScore, notableScore)
  
  if (importantScore > notableScore) {
    return {
      labels: ["important", "notable", "skip"],
      scores: [importantScore, notableScore, skipScore]
    }
  } else if (notableScore > skipScore) {
    return {
      labels: ["notable", "important", "skip"],
      scores: [notableScore, importantScore, skipScore]
    }
  } else {
    return {
      labels: ["skip", "important", "notable"],
      scores: [skipScore, importantScore, notableScore]
    }
  }
}