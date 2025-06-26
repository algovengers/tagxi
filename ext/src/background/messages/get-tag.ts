import type { PlasmoMessaging } from "@plasmohq/messaging"
import { getTagsBySite } from "~lib/api"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    const { url } = req.body as { url: string }

    console.log("Fetching tags for URL:", url)

    // Use the API utility to get tags by site
    const tags = await getTagsBySite(url)
    
    res.send({
      success: true,
      data: tags,
      message: "Tags retrieved successfully"
    })

  } catch (error) {
    console.error("Error in get-tag handler:", error)
    
    res.send({ 
      success: false, 
      error: error.message,
      message: "Failed to fetch tags"
    })
  }
}

export default handler
