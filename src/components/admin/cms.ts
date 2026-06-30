import { supabase } from '@/lib/supabase';

export type Creds = { username: string; password: string };

export async function cms<T = any>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const auth = JSON.parse(localStorage.getItem('pts_auth') || '{}');
  const { data, error } = await supabase.functions.invoke('owner-auth', {
    body: { action, auth, ...payload },
  });
  if (error) throw new Error(error.message);
  if (data && data.ok === false) throw new Error(data.error || 'Request failed');
  return data as T;
}

export async function uploadMedia(file: File, category?: string): Promise<string> {
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('Image is too large (max 25MB). Please use a smaller file.');
  }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${category || 'media'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from('pts-media')
    .upload(path, file, { upsert: true, contentType: file.type || undefined, cacheControl: '3600' });
  if (error) {
    throw new Error('Upload failed: ' + (error.message || 'storage error') + '. Please try again.');
  }
  const { data } = supabase.storage.from('pts-media').getPublicUrl(path);
  const url = data.publicUrl;
  try { await cms('cms_media_save', { url, name: file.name, category: category || null }); } catch { /* non-blocking */ }
  return url;
}


export const isOwner = () => localStorage.getItem('pts_role') === 'owner';
