import type { PlasmoMessaging } from "@plasmohq/messaging"

import { getTagsBySite } from "~lib/api"
import { HTTPError } from "~lib/error"

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
    res.send({
      success: false,
      error: error.message,
      message: "Failed to fetch tags",
      authenticationRequired:
        error instanceof HTTPError ? [400, 401].includes(error.code) : false
    })
  }
}

export default handler
