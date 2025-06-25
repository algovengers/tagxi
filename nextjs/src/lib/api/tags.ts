// Types and interfaces for Tags API

export interface TagMetadata {
  start_tag_xpath: string;
  end_tag_xpath: string;
  start_tag_offset: number;
  end_tag_offset: number;
}

export interface CreateTagRequest {
  site: string;
  metadata: TagMetadata;
  usernames: string[];
}

export interface TagResponse {
  owner: string;
  metadata: TagMetadata;
}

export interface GetTagsResponse {
  tags: TagResponse[];
}

export interface GetTagsParams {
  username?: string;
  site?: string;
}

// API Base URL - adjust this for your environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
  // You might need to adjust this based on your auth implementation
  // For example, if using cookies, you might not need to add headers
  return {
    'Content-Type': 'application/json',
  };
}

/**
 * Create a new tag
 * @param tagData - The tag data including site, metadata, and usernames
 * @returns Promise that resolves when tag is created successfully
 */
export async function saveTag(tagData: CreateTagRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/tags`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(tagData),
    credentials: 'include', // Include cookies for auth
  });

  await handleResponse(response);
}

/**
 * Get tags with optional filtering
 * @param params - Optional parameters to filter tags (username, site)
 * @returns Promise that resolves to an array of tags
 */
export async function getTags(params?: GetTagsParams): Promise<TagResponse[]> {
  const url = new URL(`${API_BASE_URL}/api/tags`);
  
  if (params?.username) {
    url.searchParams.append('username', params.username);
  }
  
  if (params?.site) {
    url.searchParams.append('site', params.site);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include', // Include cookies for auth
  });

  const data = await handleResponse<GetTagsResponse>(response);
  return data.tags;
}

/**
 * Get tags by specific site
 * @param site - The site URL to filter tags by
 * @returns Promise that resolves to an array of tags for the site
 */
export async function getTagsBySite(site: string): Promise<TagResponse[]> {
  return getTags({ site });
}

/**
 * Get tags by specific username
 * @param username - The username to filter tags by
 * @returns Promise that resolves to an array of tags for the user
 */
export async function getTagsByUsername(username: string): Promise<TagResponse[]> {
  return getTags({ username });
}

/**
 * Get tags by both site and username
 * @param site - The site URL to filter tags by
 * @param username - The username to filter tags by
 * @returns Promise that resolves to an array of tags matching both criteria
 */
export async function getTagsBySiteAndUsername(site: string, username: string): Promise<TagResponse[]> {
  return getTags({ site, username });
}

// Export all functions as a default object for convenience
export const tagsAPI = {
  saveTag,
  getTags,
  getTagsBySite,
  getTagsByUsername,
  getTagsBySiteAndUsername,
};

export default tagsAPI; 