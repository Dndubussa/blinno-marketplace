/**
 * Upload utilities with progress tracking
 * Uses XMLHttpRequest for progress tracking since Supabase Storage doesn't support progress callbacks
 */

import { supabase } from "@/integrations/supabase/client";

export interface UploadProgress {
  progress: number; // 0-100
  loaded: number; // bytes loaded
  total: number; // total bytes
}

export interface UploadOptions {
  bucket: string;
  path: string;
  file: File;
  onProgress?: (progress: UploadProgress) => void;
  cacheControl?: string;
  upsert?: boolean;
}

/**
 * Upload file to Supabase Storage with progress tracking
 */
export async function uploadFileWithProgress(
  options: UploadOptions
): Promise<{ data: { path: string } | null; error: any }> {
  const { bucket, path, file, onProgress, cacheControl, upsert } = options;

  return new Promise((resolve) => {
    // Get the Supabase storage URL from environment
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      resolve({ data: null, error: { message: "Supabase configuration missing" } });
      return;
    }
    
    const storageUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

    // Get the session token
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        resolve({ data: null, error: { message: "Not authenticated" } });
        return;
      }

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = Math.round((e.loaded / e.total) * 100);
          onProgress({
            progress,
            loaded: e.loaded,
            total: e.total,
          });
        }
      });

      // Handle completion
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ data: { path }, error: null });
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            resolve({ data: null, error });
          } catch {
            resolve({
              data: null,
              error: { message: `Upload failed with status ${xhr.status}` },
            });
          }
        }
      });

      // Handle errors
      xhr.addEventListener("error", () => {
        resolve({
          data: null,
          error: { message: "Network error during upload" },
        });
      });

      // Open and send request
      xhr.open("POST", storageUrl, true);
      xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
      xhr.setRequestHeader("apikey", supabaseKey);
      xhr.setRequestHeader("x-upsert", upsert ? "true" : "false");
      if (cacheControl) {
        xhr.setRequestHeader("cache-control", cacheControl);
      }

      const formData = new FormData();
      formData.append("file", file);
      xhr.send(formData);
    });
  });
}

/**
 * Get public URL for uploaded file
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

