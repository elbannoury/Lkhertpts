import { supabase } from '@/lib/supabase';

export async function submitHelpWidgetMessage(input: { name?: string; contact?: string; message: string }) {
  const { data, error } = await supabase.functions.invoke('owner-auth', {
    body: {
      action: 'help_widget_submit',
      name: input.name || null,
      contact: input.contact || null,
      message: input.message,
      page_url: typeof window !== 'undefined' ? window.location.href : null,
    },
  });
  if (error) throw new Error(error.message);
  if (data && data.ok === false) throw new Error(data.error || 'Could not send message');
  return data;
}
