import type { PlasmoMessaging } from "@plasmohq/messaging"

import { authClient } from "~lib/auth/auth-client"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    console.log("🔐 get-auth: Checking authentication...")
    const session = await authClient.getSession()
    
    console.log("✅ get-auth: Session check complete")
    
    res.send({
      redirect: session
    })
  } catch (error) {
    console.error("❌ get-auth: Error in handler:", error);
    res.send({
      redirect: null
    })
  }
}

export default handler