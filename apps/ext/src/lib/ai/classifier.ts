import { pipeline, env } from "@xenova/transformers"

// Configure transformers to use local models
env.allowRemoteModels = false
env.allowLocalModels = true

let classifier: any = null

/**
 * Load the zero-shot classifier model once
 */
export async function loadClassifier() {
  if (!classifier) {
    try {
      console.log("🤖 Loading AI classifier...")
      classifier = await pipeline(
        "zero-shot-classification",
        "Xenova/distilbert-base-uncased-mnli"
      )
      console.log("✅ AI classifier loaded successfully")
    } catch (error) {
      console.error("❌ Failed to load AI classifier:", error)
      throw error
    }
  }
  return classifier
}

/**
 * Classify text content using the loaded model
 */
export async function classifyContent(
  text: string,
  labels: string[] = ["important", "notable", "skip"]
) {
  const model = await loadClassifier()
  return await model(text, labels)
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