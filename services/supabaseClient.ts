import { createClient } from '@supabase/supabase-js';

// Fallback credentials
const DEFAULT_URL = 'https://atispiaiszpudwlpirkv.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0aXNwaWFpc3pwdWR3bHBpcmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3ODQ0ODEsImV4cCI6MjA4NDM2MDQ4MX0.mKqwtgzCyIyaDY4QmHv2ThxWmGhnu7YvArGERXQHPeQ';

// Safe environment variable retrieval
const getEnvVar = (viteKey: string, processKey: string): string => {
  let val = '';
  try {
    // 1. Try Vite import.meta.env
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      val = (import.meta as any).env[viteKey] || '';
    }
    // 2. Try process.env if Vite didn't yield a value
    // We check typeof process first to avoid ReferenceError in browsers
    if (!val && typeof process !== 'undefined' && process.env) {
      val = process.env[viteKey] || process.env[processKey] || '';
    }
  } catch (e) {
    // Suppress errors to prevent app crash
    console.warn(`Error reading env var ${viteKey}:`, e);
  }
  return val;
};

const url = getEnvVar('VITE_SUPABASE_URL', 'REACT_APP_SUPABASE_URL') || DEFAULT_URL;
const key = getEnvVar('VITE_SUPABASE_ANON_KEY', 'REACT_APP_SUPABASE_ANON_KEY') || DEFAULT_KEY;

// Diagnostic
console.log('[Supabase] Initializing with URL:', url ? 'Present' : 'Missing');

export const isConnected = url && url !== 'https://placeholder.supabase.co';

// Create client
export const supabase = createClient(url, key);

// --- Helper Functions ---

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Compresses an image file to WebP format with resizing logic.
 * Max width: 1920px, Quality: 0.8
 */
const compressImage = async (file: File): Promise<File> => {
  // If it's not an image, return original
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = (e) => reject(e);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file); // Fallback to original if canvas fails
        return;
      }

      // Calculate new dimensions (Max width 1920px)
      const MAX_WIDTH = 1920;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image to canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Export as WebP
      canvas.toBlob((blob) => {
        if (blob) {
          // Create new file with .webp extension
          const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
          const compressedFile = new File([blob], newName, {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        } else {
          resolve(file);
        }
      }, 'image/webp', 0.8); // 80% quality
    };

    reader.readAsDataURL(file);
  });
};

// Helper for uploading images
export const uploadImage = async (file: File, folder: 'properties' | 'passports'): Promise<string | null> => {
  try {
    // 1. Compress Image to WebP
    const compressedFile = await compressImage(file);
    
    // Immediate fallback if not connected
    if (!isConnected) {
        console.log('Not connected to Supabase, converting compressed image to base64 for demo.');
        return await fileToBase64(compressedFile);
    }

    const fileName = `${folder}/${Math.random().toString(36).substring(2)}_${Date.now()}.webp`;
    
    // Upload to 'images' bucket
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, compressedFile, {
        contentType: 'image/webp',
        cacheControl: '3600', // Cache for 1 hour in CDN
        upsert: false
      });

    if (error) {
      console.error('Error uploading image to Supabase:', error);
      console.warn('Falling back to base64 encoding due to upload failure.');
      return await fileToBase64(compressedFile);
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    // Verify if the URL is actually accessible
    // This handles cases where the bucket is private or RLS blocks access
    try {
        const response = await fetch(publicUrl, { method: 'HEAD' });
        if (response.ok) {
            return publicUrl;
        } else {
            console.warn(`Public URL check failed (${response.status}), falling back to base64.`);
            return await fileToBase64(compressedFile);
        }
    } catch (fetchError) {
        // Fetch might fail due to CORS or network, if so we assume it might not be displayable
        // and fall back to base64 to be safe for the user experience.
        console.warn("Public URL reachability check failed (CORS/Network), falling back to base64.", fetchError);
        return await fileToBase64(compressedFile);
    }

  } catch (err) {
    console.error('Upload exception:', err);
    // Fallback on crash
    return await fileToBase64(file);
  }
};
