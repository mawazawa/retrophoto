import { createClient } from '@/lib/supabase/server';

/**
 * Sanitize filename to prevent path traversal and special character issues
 * Removes all non-alphanumeric characters except dots, hyphens, underscores
 */
function sanitizeFilename(filename: string): string {
  // Get extension if present
  const lastDot = filename.lastIndexOf('.');
  const extension = lastDot > 0 ? filename.slice(lastDot).toLowerCase() : '';
  const baseName = lastDot > 0 ? filename.slice(0, lastDot) : filename;

  // Remove any path components and sanitize
  const sanitized = baseName
    .replace(/^.*[\\/]/, '') // Remove any path prefix
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars with underscore
    .slice(0, 50); // Limit length

  // Only allow safe image extensions
  const safeExtension = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)
    ? extension
    : '.jpg';

  return sanitized || 'upload' + safeExtension;
}

export async function uploadOriginalImage(
  file: File,
  fingerprint: string
): Promise<string> {
  const supabase = await createClient();
  // Sanitize the filename to prevent injection
  const safeFilename = sanitizeFilename(file.name);
  const fileName = `${fingerprint}-${Date.now()}-${safeFilename}`;
  const filePath = `originals/${fileName}`;

  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      metadata: {
        fingerprint,
        ttl_expires_at: new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    });

  if (error) throw error;

  // Get public URL (bucket is public for simplicity)
  const {
    data: { publicUrl },
  } = supabase.storage.from('uploads').getPublicUrl(data.path);

  return publicUrl;
}

export async function uploadRestoredImage(
  imageBuffer: Buffer,
  sessionId: string
): Promise<string> {
  const supabase = await createClient();
  const fileName = `restored-${sessionId}.jpg`;
  const filePath = `restorations/${fileName}`;

  const { data, error } = await supabase.storage
    .from('restorations')
    .upload(filePath, imageBuffer, {
      contentType: 'image/jpeg',
      cacheControl: '31536000', // 1 year
      upsert: false,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from('restorations').getPublicUrl(data.path);

  return publicUrl;
}
