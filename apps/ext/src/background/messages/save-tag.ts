import type { PlasmoMessaging } from "@plasmohq/messaging"

import { saveTag } from "~lib/api"
import { HTTPError } from "~lib/error"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    const {
      url,
      selection,
      tag,
      timestamp,
      startContainerXPath,
      endContainerXPath,
      startOffset,
      endOffset
    } = req.body as {
      url: string
      selection: string
      tag: string
      timestamp: number
      startContainerXPath: string
      endContainerXPath: string
      startOffset: number
      endOffset: number
    }

    console.log("Saving tag to backend:", { url, selection, tag, timestamp })

    // Prepare the data according to the new API structure
    const tagData = {
      site: url,
      metadata: {
        start_tag_xpath: startContainerXPath,
        end_tag_xpath: endContainerXPath,
        start_tag_offset: startOffset,
        end_tag_offset: endOffset
      },
      usernames: [tag] // Extract username from tag (remove @ if present)
    }

    // Use the API utility to save the tag
    await saveTag(tagData)

    // Send success response back to content script
    res.send({
      success: true,
      message: "Tag saved successfully"
    })
  } catch (error) {
    console.error("Error in save-tag handler:", error)

    res.send({
      success: false,
      error: error.message,
      message: "Failed to save tag",
      authenticationRequired:
        error instanceof HTTPError ? 401 === error.code : false
    })
  }
}

export default handler
