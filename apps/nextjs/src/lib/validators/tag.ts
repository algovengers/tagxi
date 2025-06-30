import { z } from "zod";

export const metadataSchema = z.object({
  start_tag_xpath: z.string().min(1, "Start tag XPath is required"),
  end_tag_xpath: z.string().min(1, "End tag XPath is required"),
  start_tag_offset: z
    .number()
    .int()
    .min(0, "Start tag offset must be non-negative"),
  end_tag_offset: z
    .number()
    .int()
    .min(0, "End tag offset must be non-negative"),
});

export const createTagSchema = z.object({
  site: z.string().url("Invalid site URL").min(1, "Site URL is required"),
  metadata: metadataSchema,
  usernames: z.array(z.string()).min(1),
  message: z.string().optional(),
});

export const getTagsByWebsiteSchema = z.object({
  site: z
    .string()
    .url("Invalid site URL parameter")
    .min(1, "Site URL parameter is required"),
});

export const getTagsByPageSchema = z.object({
  url: z
    .string()
    .url("Invalid URL parameter")
    .min(1, "URL parameter is required"),
});

export const tagIdSchema = z.object({
  id: z.string().uuid("Invalid tag ID format"),
});

export const tagFilterSchema = z.object({
  site: z.string(),
  username: z.string(),
});
