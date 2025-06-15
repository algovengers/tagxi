import { useEffect, useState } from "react"
import { authClient } from "~lib/auth/auth-client"
import "~style.css"

function Popup() {
  const [currentTab, setCurrentTab] = useState("")
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const { data, isPending, error, refetch } = authClient.useSession()

  async function getCurrentUrl() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    setCurrentTab(tab.url)
  }

  useEffect(() => {
    getCurrentUrl()

    // chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    //   if (message.type === "OAUTH_SUCCESS") {
    //     console.log("Token received in popup:", message.token)
    //     chrome.storage.local.set({ token: message.token }, () => {
    //       console.log("Token saved in popup")
    //       refetch()
    //     })
    //   }
    // })
  }, [])

  async function signInToGoogle() {
    if (isAuthenticating) return

    setIsAuthenticating(true)
    try {
      const response = await authClient.signIn.social({ provider: "google" })
      const authUrl = response.data?.url

      if (!authUrl) {
        throw new Error("No auth URL from BetterAuth")
      }

      console.log("Opening auth tab:", authUrl)
      chrome.tabs.create({ url: authUrl }, () => {
        setIsAuthenticating(false)
      })

    } catch (err) {
      setIsAuthenticating(false)
      console.error("Google Sign-In failed:", err)
    }
  }

  async function signOut() {
    try {
      await authClient.signOut()
      await refetch()
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const Comp = () => {
    if (isPending) return <>Loading...</>
    if (error) return <>Error: {error.message}</>
    if (data?.user) {
      return (
        <div>
          <div>Signed in as {data.user.name}</div>
          <button onClick={signOut} style={{ marginTop: "8px" }}>
            Sign Out
          </button>
        </div>
      )
    }
    return <div>Not signed in</div>
  }

  return (
    <div style={{ width: "12rem", padding: "16px" }}>
      <h2 className="text-red-400">Hello</h2>
      <h2>Backend = {process.env.PLASMO_PUBLIC_BACKEND_URL}</h2>
      <h4>{currentTab}</h4>
      <Comp />
      <button
        onClick={signInToGoogle}
        disabled={isAuthenticating || isPending}
        style={{ marginTop: "8px" }}
      >
        {isAuthenticating ? "Authenticating..." : isPending ? "Loading" : "Sign In with Google"}
      </button>
    </div>
  )
}

export default Popup
