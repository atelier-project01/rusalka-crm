// Shared (non-server) constants/types for segmentation settings. Kept out of
// actions.ts because a "use server" module may only export async functions.

export const CONFIG_KEYS = ["skin_types", "concerns", "lifecycle_stages", "tags"] as const;
export type ConfigKey = (typeof CONFIG_KEYS)[number];
export type SegmentConfig = Record<ConfigKey, string[]>;
