import { createClient } from '@/lib/supabase/server';

export async function uploadOriginalImage(
  file: File,
  fingerprint: string
): Promise<string> {
  const supabase = await createClient();
  const fileName = `${fingerprint}-${Date.now()}-${file.name}`;
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
