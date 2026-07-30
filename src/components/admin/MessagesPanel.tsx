import React, { useEffect, useState } from 'react';
import { Mail, MailOpen, Trash2, Phone, User } from 'lucide-react';
import { cms } from './cms';

interface HelpMessage {
  id: string;
  name: string | null;
  contact: string | null;
  message: string;
  page_url: string | null;
  is_read: boolean;
  created_at: string;
}

const MessagesPanel: React.FC = () => {
  const [messages, setMessages] = useState<HelpMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    cms<{ messages: HelpMessage[] }>('cms_help_widget_list')
      .then((r) => setMessages(r.messages || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string, is_read: boolean) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_read } : m)));
    try { await cms('cms_help_widget_mark_read', { id, is_read }); } catch { load(); }
  };

  const remove = async (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    try { await cms('cms_help_widget_delete', { id }); } catch { load(); }
  };

  if (loading) return <div className="p-8 text-center text-[#8D8D8D]">Loading…</div>;

  return (
    <div className="space-y-3">
      <h2 className="font-serif text-2xl mb-4">Messages from the help bubble</h2>
      {messages.length === 0 && (
        <div className="bg-white border border-[#eee] rounded-xl p-8 text-center text-[#8D8D8D]">No messages yet.</div>
      )}
      {messages.map((m) => (
        <div key={m.id} className={`bg-white border rounded-xl p-4 ${m.is_read ? 'border-[#eee]' : 'border-[#6E44FF]'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 text-xs text-[#8D8D8D] mb-1.5 flex-wrap">
                {m.name && <span className="flex items-center gap-1"><User size={12} /> {m.name}</span>}
                {m.contact && <span className="flex items-center gap-1"><Phone size={12} /> {m.contact}</span>}
                <span>{new Date(m.created_at).toLocaleString()}</span>
                {!m.is_read && <span className="text-[#6E44FF] font-medium">New</span>}
              </div>
              <p className="text-sm text-[#1D1D1D] whitespace-pre-wrap">{m.message}</p>
              {m.page_url && <p className="text-xs text-[#bbb] mt-1.5 truncate">{m.page_url}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => markRead(m.id, !m.is_read)} className="text-[#999] hover:text-[#1D1D1D]" title={m.is_read ? 'Mark unread' : 'Mark read'}>
                {m.is_read ? <MailOpen size={16} /> : <Mail size={16} />}
              </button>
              <button onClick={() => remove(m.id)} className="text-[#ccc] hover:text-red-500" title="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessagesPanel;
