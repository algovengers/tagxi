// Types and interfaces for Settings API

export interface ExtensionSettings {
  tag_color: string;
}

export interface SettingsResponse {
  id: string;
  userId: string;
  markerColor: string;
  extensionSettings: ExtensionSettings;
  blockedWebsites: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsRequest {
  markerColor?: string;
  extensionSettings?: ExtensionSettings;
  blockedWebsites?: string[];
}

// API Base URL - use environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

/**
 * Get user settings
 * @returns Promise that resolves to user settings
 */
export async function getSettings(): Promise<SettingsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/settings`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include', // Include cookies for auth
  });

  return handleResponse<SettingsResponse>(response);
}

/**
 * Update user settings
 * @param settingsData - The settings data to update
 * @returns Promise that resolves to updated settings
 */
export async function updateSettings(settingsData: UpdateSettingsRequest): Promise<SettingsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settingsData),
    credentials: 'include', // Include cookies for auth
  });

  return handleResponse<SettingsResponse>(response);
}

// Export all functions as a default object for convenience
export const settingsAPI = {
  getSettings,
  updateSettings,
};

export default settingsAPI;