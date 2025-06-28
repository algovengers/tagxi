import type { PlasmoMessaging } from "@plasmohq/messaging"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    const API_BASE_URL = process.env.PLASMO_PUBLIC_BACKEND_URL;
    
    const response = await fetch(`${API_BASE_URL}/api/settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const settings = await response.json();

    res.send({
      success: true,
      data: settings,
      message: "Settings retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.send({
      success: false,
      error: error.message,
      message: "Failed to fetch settings"
    });
  }
}

export default handler