import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cms, isOwner } from './cms';
import { supabase } from '@/lib/supabase';
import ConfirmDialog from './ConfirmDialog';
import { Send, Paperclip, Mic, Video, Square, X, FileText, Download, Loader2, Trash2, Trophy, Plus, Gift, Pencil, Eraser } from 'lucide-react';



interface Msg {
  id: string;
  admin_id: string;
  display_name: string;
  color: string;
  emoji: string;
  body: string;
  created_at: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
}

interface Challenge {
  id: string; title: string; description?: string | null; goal_type: string;
  goal_target: number; prize?: string | null; starts_at: string; ends_at?: string | null;
  status: string; progress: number; created_by?: string | null;
}

async function uploadChatFile(file: Blob, filename: string): Promise<string> {
  const ext = (filename.split('.').pop() || 'bin').toLowerCase();
  const path = `chat/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('pts-media').upload(path, file, { upsert: true, contentType: (file as any).type || undefined });
  if (error) throw error;
  return supabase.storage.from('pts-media').getPublicUrl(path).data.publicUrl;
}

function kindOf(type?: string | null): 'image' | 'video' | 'audio' | 'file' {
  const t = (type || '').toLowerCase();
  if (t.startsWith('image')) return 'image';
  if (t.startsWith('video')) return 'video';
  if (t.startsWith('audio')) return 'audio';
  return 'file';
}

const goalLabel: Record<string, string> = {
  products: 'New products added',
  orders: 'Orders received',
  revenue: 'Revenue earned',
  custom: 'Custom goal',
};
const fmtMetric = (type: string, n: number) =>
  type === 'revenue' ? `${(n / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })} IQD` : String(n);

const Attachment: React.FC<{ m: Msg; mine: boolean }> = ({ m, mine }) => {
  if (!m.attachment_url) return null;
  const kind = kindOf(m.attachment_type);
  if (kind === 'image') {
    return <img src={m.attachment_url} alt={m.attachment_name || 'image'} loading="lazy" className="rounded-lg max-w-full max-h-64 object-cover mb-1" />;
  }
  if (kind === 'video') {
    return <video src={m.attachment_url} controls preload="metadata" className="rounded-lg max-w-full max-h-64 mb-1" />;
  }
  if (kind === 'audio') {
    return <audio src={m.attachment_url} controls preload="none" className="w-56 max-w-full mb-1" />;
  }
  return (
    <a href={m.attachment_url} target="_blank" rel="noopener noreferrer" download
      className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-1 text-sm ${mine ? 'bg-white/20' : 'bg-black/5'}`}>
      <FileText size={16} />
      <span className="truncate max-w-[160px]">{m.attachment_name || 'file'}</span>
      <Download size={14} className="opacity-70" />
    </a>
  );
};

// ── Challenge board (shared with the whole team) ──────────────────────
const emptyChallenge = (): any => ({
  title: '', goal_type: 'products', goal_target: 100, prize: '', description: '',
  ends_at: '', status: 'active',
});

const ChallengeBoard: React.FC<{
  challenges: Challenge[];
  owner: boolean;
  onChange: (list: Challenge[]) => void;
}> = ({ challenges, owner, onChange }) => {
  const [editing, setEditing] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!editing?.title?.trim()) return;
    setBusy(true);
    try {
      const payload = { ...editing, ends_at: editing.ends_at ? new Date(editing.ends_at).toISOString() : null };
      const r: any = await cms('challenge_save', { challenge: payload });
      if (r?.challenges) onChange(r.challenges);
      setEditing(null);
    } catch (e: any) { alert(e?.message || 'Could not save challenge'); }
    finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    if (!confirm('Delete this challenge for the whole team?')) return;
    try { const r: any = await cms('challenge_delete', { id }); if (r?.challenges) onChange(r.challenges); } catch { /* ignore */ }
  };

  return (
    <div className="bg-white border border-[#eee] rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={16} className="text-[#C9A23F]" />
        <h3 className="font-serif text-lg">Team Challenges</h3>
        {owner && (
          <button onClick={() => setEditing(emptyChallenge())} className="ml-auto text-xs bg-[#C9A23F] text-black font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-[#E8C766]">
            <Plus size={13} /> New
          </button>
        )}
      </div>

      {challenges.length === 0 && (
        <p className="text-sm text-[#bbb]">{owner ? 'No challenge yet — set a team goal like “Add 100 products this week”.' : 'No active challenge right now.'}</p>
      )}

      <div className="space-y-3">
        {challenges.map((c) => {
          const pct = Math.min(100, Math.round((c.progress / Math.max(1, c.goal_target)) * 100));
          const done = c.progress >= c.goal_target;
          const daysLeft = c.ends_at ? Math.ceil((new Date(c.ends_at).getTime() - Date.now()) / 86400000) : null;
          return (
            <div key={c.id} className={`rounded-xl border p-3.5 ${done ? 'border-emerald-300 bg-emerald-50' : 'border-[#f0ece2] bg-[#FAF8F5]'}`}>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="font-medium text-[#222] flex items-center gap-1.5">
                    {c.title}
                    {done && <span className="text-[10px] uppercase tracking-wide bg-emerald-500 text-white px-1.5 py-0.5 rounded">Reached!</span>}
                  </p>
                  {c.description && <p className="text-xs text-[#999] mt-0.5">{c.description}</p>}
                </div>
                {owner && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setEditing({ ...c, ends_at: c.ends_at ? c.ends_at.slice(0, 10) : '' })} className="text-[#bbb] hover:text-[#1D1D1D]"><Pencil size={13} /></button>
                    <button onClick={() => remove(c.id)} className="text-[#ccc] hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                )}
              </div>

              <div className="mt-2.5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#888]">{goalLabel[c.goal_type] || 'Goal'}</span>
                  <span className="font-semibold" style={{ color: done ? '#059669' : '#C9A23F' }}>
                    {fmtMetric(c.goal_type, c.progress)} / {fmtMetric(c.goal_type, c.goal_target)}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-[#ece6da] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: pct + '%', background: done ? 'linear-gradient(90deg,#34d399,#059669)' : 'linear-gradient(90deg,#E8C766,#C9A23F)' }} />
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[11px] text-[#aaa]">
                  <span>{pct}% complete · auto-counted live</span>
                  {daysLeft != null && <span>{daysLeft > 0 ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : 'Ended'}</span>}
                </div>
              </div>

              {c.prize && (
                <div className="mt-2.5 flex items-center gap-1.5 text-xs bg-white border border-[#f0e6c8] text-[#9a7a1f] rounded-lg px-2.5 py-1.5">
                  <Gift size={13} /> <span className="font-medium">Giveaway:</span> {c.prize}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
          <div className="bg-white w-full max-w-md p-6 rounded-xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl flex items-center gap-2"><Trophy size={18} className="text-[#C9A23F]" /> {editing.id ? 'Edit' : 'New'} Challenge</h3>
              <button onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Title — e.g. Add 100 products this week" className="w-full border border-[#ddd] px-3 py-2 rounded-lg" />
              <textarea value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Description (optional)" className="w-full border border-[#ddd] px-3 py-2 rounded-lg h-16" />
              <div className="grid grid-cols-2 gap-3">
                <select value={editing.goal_type} onChange={(e) => setEditing({ ...editing, goal_type: e.target.value })} className="border border-[#ddd] px-3 py-2 rounded-lg">
                  <option value="products">New products</option>
                  <option value="orders">Orders</option>
                  <option value="revenue">Revenue (IQD)</option>
                  <option value="custom">Custom</option>
                </select>
                <input type="number" min={1} value={editing.goal_target} onChange={(e) => setEditing({ ...editing, goal_target: e.target.value })} placeholder="Target" className="border border-[#ddd] px-3 py-2 rounded-lg" />
              </div>
              <label className="block text-xs text-[#999]">Ends on (optional — leave blank for ongoing)
                <input type="date" value={editing.ends_at || ''} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value })} className="w-full border border-[#ddd] px-3 py-2 rounded-lg mt-1 text-[#333]" />
              </label>
              <input value={editing.prize || ''} onChange={(e) => setEditing({ ...editing, prize: e.target.value })} placeholder="Giveaway / prize (optional) — e.g. 50,000 IQD bonus" className="w-full border border-[#ddd] px-3 py-2 rounded-lg" />
              <p className="text-[11px] text-[#aaa]">Progress is calculated automatically from real store data — no manual counting needed.</p>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-[#8D8D8D]">Cancel</button>
              <button disabled={busy || !editing.title?.trim()} onClick={save} className="bg-[#C9A23F] text-black font-medium px-5 py-2 text-sm rounded-lg disabled:opacity-50 hover:bg-[#E8C766]">{busy ? 'Saving…' : 'Share with team'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  const [meId, setMeId] = useState('');
  const owner = isOwner();

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState<'audio' | 'video' | null>(null);
  const [recSeconds, setRecSeconds] = useState(0);
  // Designed confirmation windows for chat moderation.
  const [pendingDelete, setPendingDelete] = useState<Msg | null>(null);
  const [delBusy, setDelBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearBusy, setClearBusy] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const atBottom = useRef(true);
  const lastSig = useRef('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const recTimer = useRef<any>(null);

  const load = useCallback(async () => {
    try {
      const r = await cms('chat_list');
      if (r?.ok) {
        const sig = (r.messages || []).map((m: Msg) => m.id).join(',')
          + '|' + (r.challenges || []).map((c: Challenge) => c.id + ':' + c.progress + ':' + c.goal_target).join(',');
        if (sig !== lastSig.current) {
          lastSig.current = sig;
          setMessages(r.messages || []);
          setChallenges(r.challenges || []);
        }

        if (r.meId) setMeId(r.meId);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    load();
    let id: any;
    const start = () => { id = setInterval(load, 3500); };
    const stop = () => { if (id) clearInterval(id); id = null; };
    start();
    const onVis = () => { if (document.hidden) stop(); else { load(); if (!id) start(); } };
    document.addEventListener('visibilitychange', onVis);
    return () => { stop(); document.removeEventListener('visibilitychange', onVis); };
  }, [load]);

  useEffect(() => {
    if (atBottom.current && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  const pushMessage = async (payload: { body?: string; attachment_url?: string; attachment_type?: string; attachment_name?: string }) => {
    atBottom.current = true;
    await cms('chat_send', payload);
    await load();
  };

  // Open the designed confirm window for removing a single message.
  const deleteMessage = (m: Msg) => setPendingDelete(m);

  const runDeleteMessage = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setDelBusy(true);
    // Optimistic removal so it feels instant — the server truly deletes it for everyone.
    setMessages((prev) => prev.filter((m) => m.id !== id));
    lastSig.current = '';
    try { await cms('chat_delete', { id }); }
    catch (e: any) { alert(e?.message || 'Could not remove message'); }
    finally {
      setDelBusy(false);
      setPendingDelete(null);
      await load();
    }
  };

  // Owner-only: wipe the entire team chat for everyone.
  const runClearChat = async () => {
    setClearBusy(true);
    setMessages([]);
    lastSig.current = '';
    try { await cms('chat_clear'); }
    catch (e: any) { alert(e?.message || 'Could not clear chat'); }
    finally {
      setClearBusy(false);
      setConfirmClear(false);
      await load();
    }
  };



  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const body = text.trim();
    setText('');
    try { await pushMessage({ body }); } catch { setText(body); }
    setSending(false);
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { alert('File too large (max 50MB).'); return; }
    setUploading(true);
    try {
      const url = await uploadChatFile(file, file.name);
      await pushMessage({ attachment_url: url, attachment_type: file.type || 'application/octet-stream', attachment_name: file.name });
    } catch (err: any) { alert('Upload failed: ' + (err?.message || err)); }
    setUploading(false);
  };

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (recTimer.current) { clearInterval(recTimer.current); recTimer.current = null; }
  };

  const startRecording = async (mode: 'audio' | 'video') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(mode === 'video' ? { video: true, audio: true } : { audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      recorderRef.current = mr;
      mr.ondataavailable = (ev) => { if (ev.data.size > 0) chunksRef.current.push(ev.data); };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mode === 'video' ? 'video/webm' : 'audio/webm' });
        stopTracks();
        setUploading(true);
        try {
          const name = `${mode}-${Date.now()}.webm`;
          const url = await uploadChatFile(blob, name);
          await pushMessage({ attachment_url: url, attachment_type: blob.type, attachment_name: name });
        } catch (err: any) { alert('Upload failed: ' + (err?.message || err)); }
        setUploading(false);
      };
      mr.start();
      setRecording(mode);
      setRecSeconds(0);
      recTimer.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);
      if (mode === 'video' && previewRef.current) { previewRef.current.srcObject = stream; previewRef.current.play().catch(() => {}); }
    } catch {
      alert('Could not access ' + (mode === 'video' ? 'camera' : 'microphone') + '. Please allow permission.');
    }
  };

  const stopRecording = () => { recorderRef.current?.stop(); setRecording(null); };
  const cancelRecording = () => {
    const mr = recorderRef.current;
    if (mr) { mr.onstop = null as any; if (mr.state !== 'inactive') mr.stop(); }
    stopTracks(); setRecording(null);
  };

  useEffect(() => () => { stopTracks(); }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div>
      <div>

        <ChallengeBoard challenges={challenges} owner={owner} onChange={setChallenges} />

        <div className="bg-white border border-[#eee] rounded-xl flex flex-col h-[560px] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#f0f0f0] flex items-center gap-2">
            <h3 className="font-serif text-lg">Team Chat</h3>
            {owner && messages.length > 0 && (
              <button
                onClick={() => setConfirmClear(true)}
                title="Clear the entire chat for everyone (owner)"
                className="ml-auto flex items-center gap-1 text-xs text-red-500 border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded-lg"
              >
                <Eraser size={13} /> Clear chat
              </button>
            )}
          </div>



          <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#FAF8F5]">
            {messages.length === 0 && <p className="text-center text-[#bbb] text-sm mt-10">No messages yet. Say hello to your team.</p>}
            {messages.map((m) => {
              const mine = m.admin_id === meId;
              const canDelete = mine || owner;
              return (
                <div key={m.id} className={`group flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className="flex items-center gap-1.5 mb-1 px-1" style={{ flexDirection: mine ? 'row-reverse' : 'row' }}>
                      <span className="text-base leading-none">{m.emoji}</span>
                      <span className="text-xs font-semibold" style={{ color: m.color }}>{m.display_name}</span>
                      <span className="text-[10px] text-[#bbb]">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={`flex items-center gap-1.5 ${mine ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div
                        className="px-3 py-2 rounded-2xl text-sm shadow-sm"
                        style={{
                          background: mine ? `linear-gradient(135deg, ${m.color}, ${m.color}cc)` : '#ffffff',
                          color: mine ? '#fff' : '#222',
                          border: mine ? 'none' : `1px solid ${m.color}33`,
                          borderTopRightRadius: mine ? 4 : 16,
                          borderTopLeftRadius: mine ? 16 : 4,
                        }}
                      >
                        <Attachment m={m} mine={mine} />
                        {m.body && <span>{m.body}</span>}
                      </div>
                      {canDelete && (
                        <button
                          onClick={() => deleteMessage(m)}

                          title={owner && !mine ? 'Remove (owner)' : 'Remove your message'}
                          className="opacity-0 group-hover:opacity-100 transition text-[#c9c9c9] hover:text-red-500 shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          </div>

          {recording && (
            <div className="px-4 py-2 border-t border-[#f0f0f0] bg-[#fff7f2] flex items-center gap-3">
              {recording === 'video' && <video ref={previewRef} muted className="w-20 h-14 rounded-lg object-cover bg-black" />}
              <span className="flex items-center gap-2 text-sm text-[#E04E00] font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                Recording {recording} · {fmt(recSeconds)}
              </span>
              <button onClick={cancelRecording} className="ml-auto text-xs text-[#999] flex items-center gap-1 hover:text-[#444]"><X size={14} /> Cancel</button>
              <button onClick={stopRecording} className="btn-aurora px-4 py-1.5 text-xs flex items-center gap-1.5"><Square size={12} /> Send</button>
            </div>
          )}

          <form onSubmit={send} className="p-3 border-t border-[#f0f0f0] flex gap-2 items-center">
            <input ref={fileRef} type="file" className="hidden" onChange={onPickFile}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt" />
            <button type="button" title="Attach file / image / video" disabled={uploading || !!recording}
              onClick={() => fileRef.current?.click()}
              className="w-9 h-9 grid place-items-center rounded-lg border border-[#ddd] text-[#666] hover:bg-[#faf8f5] disabled:opacity-40">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
            </button>
            <button type="button" title="Record audio" disabled={uploading || !!recording}
              onClick={() => startRecording('audio')}
              className="w-9 h-9 grid place-items-center rounded-lg border border-[#ddd] text-[#666] hover:bg-[#faf8f5] disabled:opacity-40">
              <Mic size={16} />
            </button>
            <button type="button" title="Record video" disabled={uploading || !!recording}
              onClick={() => startRecording('video')}
              className="w-9 h-9 grid place-items-center rounded-lg border border-[#ddd] text-[#666] hover:bg-[#faf8f5] disabled:opacity-40">
              <Video size={16} />
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message your team…"
              className="flex-1 border border-[#ddd] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#7C3AED]"
            />
            <button type="submit" disabled={sending || !text.trim()} className="btn-aurora px-5 py-2.5 text-sm flex items-center gap-1.5 disabled:opacity-50">
              <Send size={15} /> Send
            </button>
          </form>
        </div>
      </div>


      {/* Confirm removing a single message (for everyone) */}
      <ConfirmDialog
        open={!!pendingDelete}
        title="Remove this message?"
        message={
          <>This message will be permanently deleted for <b>everyone</b> in the team chat. This cannot be undone.</>
        }
        confirmLabel="Remove message"
        busy={delBusy}
        onConfirm={runDeleteMessage}
        onCancel={() => !delBusy && setPendingDelete(null)}
      />

      {/* Owner-only confirm to clear the entire chat */}
      <ConfirmDialog
        open={confirmClear}
        title="Clear the entire chat?"
        message={
          <>Every message from <b>all team members</b> will be permanently removed for everyone. This wipes the whole conversation and cannot be undone.</>
        }
        confirmLabel="Clear everything"
        busy={clearBusy}
        onConfirm={runClearChat}
        onCancel={() => !clearBusy && setConfirmClear(false)}
      />
    </div>

  );
};

export default ChatPanel;
