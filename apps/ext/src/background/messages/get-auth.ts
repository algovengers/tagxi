import type { PlasmoMessaging } from "@plasmohq/messaging"

import { authClient } from "~lib/auth/auth-client"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const session = await authClient.getSession()
  res.send({
    redirect: session
  })
}

export default handler
