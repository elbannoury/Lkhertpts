import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Plus, Trash2, ToggleLeft, ToggleRight, UserPlus, LayoutDashboard, Package, FolderTree, Image, ShoppingBag, Users, Bell, ShieldCheck, Settings, MessageSquare, Check, Briefcase, Activity } from 'lucide-react';
import AnalyticsPanel from '@/components/admin/AnalyticsPanel';
import ProductsPanel from '@/components/admin/ProductsPanel';
import CategoriesPanel from '@/components/admin/CategoriesPanel';
import MediaPanel from '@/components/admin/MediaPanel';
import OrdersPanel from '@/components/admin/OrdersPanel';
import CustomersPanel from '@/components/admin/CustomersPanel';
import SettingsPanel from '@/components/admin/SettingsPanel';
import ChatPanel from '@/components/admin/ChatPanel';
import AffiliatesPanel from '@/components/admin/AffiliatesPanel';
import ActivityPanel from '@/components/admin/ActivityPanel';
import { cms } from '@/components/admin/cms';


const CHAT_COLORS = ['#7C3AED', '#06B6D4', '#F59E0B', '#EF4444', '#10B981', '#EC4899', '#3B82F6', '#8B5CF6'];
const CHAT_EMOJIS = ['🦊', '🐬', '🦉', '🐢', '🦁', '🐼', '🦅', '🐙', '🐺', '🦄', '🐸', '🦋'];

const OwnerAdmin: React.FC<{ portal?: 'owner' | 'admin' }> = ({ portal = 'owner' }) => {
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState<'owner' | 'admin'>('admin');
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('dashboard');

  // Each portal keeps its OWN saved session so an owner login can never leak
  // into the admin page (and vice-versa).
  const AUTH_KEY = `pts_auth_${portal}`;

  // Land on the first tab this admin actually has access to (owner always lands
  // on the dashboard; an admin with zero granted permissions lands on chat).
  const firstTabFor = (loginRole: string, perms: string[]) => {
    if (loginRole === 'owner') return 'dashboard';
    if (perms.includes('products')) return 'products';
    if (perms.includes('orders')) return 'orders';
    return 'chat';
  };

  const [identity, setIdentity] = useState<any>(null);
  const [myPerms, setMyPerms] = useState<string[]>([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [unreadChat, setUnreadChat] = useState(0);
  const [idForm, setIdForm] = useState({ display_name: '', color: CHAT_COLORS[0], emoji: CHAT_EMOJIS[0] });
  const [idSaved, setIdSaved] = useState(false);

  const [recipients, setRecipients] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [nType, setNType] = useState<'email' | 'whatsapp'>('email');
  const [nValue, setNValue] = useState(''); const [nLabel, setNLabel] = useState(''); const [nKey, setNKey] = useState('');
  const [nPurpose, setNPurpose] = useState<string[]>(['orders']);
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '' });
  const [adminPerms, setAdminPerms] = useState<string[]>(['products', 'orders']);
  const [adminMsg, setAdminMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [pwDrafts, setPwDrafts] = useState<Record<string, string>>({});
  const [pwSaved, setPwSaved] = useState<string | null>(null);

  // Reject a login that doesn't belong on this portal. Returns an error string
  // (to show) or null when the role is allowed here.
  const portalMismatch = (loginRole: string): string | null => {
    if (portal === 'admin' && loginRole === 'owner') return 'This is the staff admin portal. Owner — please use your private owner console link.';
    if (portal === 'owner' && loginRole !== 'owner') return 'This is the owner console. Admins must sign in through the staff admin link.';
    return null;
  };

  // Restore an existing session on refresh — stays signed in until "Sign Out".
  useEffect(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    if (!saved) { setRestoring(false); return; }
    (async () => {
      try {
        const c = JSON.parse(saved);
        const { data } = await supabase.functions.invoke('owner-auth', { body: { action: 'login', ...c } });
        if (data?.ok && !portalMismatch(data.role)) {
          setCreds(c); setRole(data.role); setAuthed(true);
          setMyPerms(Array.isArray(data.user?.permissions) ? data.user.permissions : []);
          localStorage.setItem('pts_auth', JSON.stringify(c)); // keep cms() helper authed after refresh
          localStorage.setItem('pts_role', data.role);
          if (data.identity) { setIdentity(data.identity); setIdForm({ display_name: data.identity.display_name || c.username, color: data.identity.color || CHAT_COLORS[0], emoji: data.identity.emoji || CHAT_EMOJIS[0] }); localStorage.setItem('pts_identity', JSON.stringify(data.identity)); }
          setTab(firstTabFor(data.role, Array.isArray(data.user?.permissions) ? data.user.permissions : []));
        } else {
          localStorage.removeItem(AUTH_KEY); localStorage.removeItem('pts_role');
        }
      } catch { /* offline — keep them out */ }
      setRestoring(false);
    })();
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setErr('');
    try {
      const { data } = await supabase.functions.invoke('owner-auth', { body: { action: 'login', ...creds } });
      if (!data?.ok) { setErr(data?.error || 'Access denied'); setLoading(false); return; }
      // Enforce the right person uses the right door.
      const mismatch = portalMismatch(data.role);
      if (mismatch) { setErr(mismatch); setLoading(false); return; }
      setRole(data.role); setAuthed(true);
      setMyPerms(Array.isArray(data.user?.permissions) ? data.user.permissions : []);
      localStorage.setItem(AUTH_KEY, JSON.stringify(creds));
      // cms() helper reads the shared 'pts_auth' key — keep it in sync with the active session.
      localStorage.setItem('pts_auth', JSON.stringify(creds));
      localStorage.setItem('pts_role', data.role);
      if (data.identity) {
        setIdentity(data.identity);
        setIdForm({
          display_name: data.identity.display_name || creds.username,
          color: data.identity.color || CHAT_COLORS[0],
          emoji: data.identity.emoji || CHAT_EMOJIS[0],
        });
        localStorage.setItem('pts_identity', JSON.stringify(data.identity));
      }
      setTab(firstTabFor(data.role, Array.isArray(data.user?.permissions) ? data.user.permissions : []));
    } catch { setErr('Access denied'); }
    setLoading(false);
  };

  const [idErr, setIdErr] = useState('');
  const saveIdentity = async () => {
    if (!idForm.display_name.trim()) { setIdErr('Please enter a display name.'); return; }
    setIdErr('');
    try {
      // The server always persists all three fields and reflects them everywhere.
      const r = await cms('set_identity', idForm);
      if (r?.ok && r.identity) {
        setIdentity(r.identity);
        // Keep the editor + sidebar chip in sync with exactly what was saved.
        setIdForm({
          display_name: r.identity.display_name || idForm.display_name,
          color: r.identity.color || idForm.color,
          emoji: r.identity.emoji || idForm.emoji,
        });
        localStorage.setItem('pts_identity', JSON.stringify(r.identity));
        setIdSaved(true); setTimeout(() => setIdSaved(false), 2000);
      } else {
        setIdErr(r?.error || 'Could not save identity. Please try again.');
      }
    } catch (e: any) {
      setIdErr(e?.message || 'Could not save identity. Please try again.');
    }
  };

  // Always reflect the identity saved in the DATABASE once signed in, so the
  // editor + sidebar chip show exactly what was last saved (persists forever
  // until the user changes it again).
  useEffect(() => {
    if (!authed) return;
    (async () => {
      try {
        const r = await cms('get_identity');
        if (r?.ok && r.identity) {
          setIdentity(r.identity);
          setIdForm({
            display_name: r.identity.display_name || creds.username,
            color: r.identity.color || CHAT_COLORS[0],
            emoji: r.identity.emoji || CHAT_EMOJIS[0],
          });
          localStorage.setItem('pts_identity', JSON.stringify(r.identity));
        }
      } catch { /* keep whatever login returned */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  // ─── Push notifications (real Web Push — works even with the tab closed) ───
  const VAPID_PUBLIC_KEY = 'BHZC-rco9nZ0-7MStscqm8JaHYsIuWoErPuzHdn0aeUBqc7EnJ_pPViAzizniiTdPeEIeMfkIMeHc0J5K3IX0Cg';
  const urlBase64ToUint8Array = (base64: string) => {
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
  };

  useEffect(() => {
    if (!authed || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
    navigator.serviceWorker.ready.then((reg) => reg.pushManager.getSubscription()).then((sub) => setPushEnabled(!!sub)).catch(() => {});
  }, [authed]);

  const enablePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) { alert('Push notifications are not supported in this browser.'); return; }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) });
      const json = sub.toJSON();
      await cms('push_subscribe', { endpoint: json.endpoint, keys: json.keys });
      setPushEnabled(true);
    } catch (e: any) {
      alert(e?.message || 'Could not enable push notifications.');
    }
  };

  const disablePush = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) { await cms('push_unsubscribe', { endpoint: sub.endpoint }); await sub.unsubscribe(); }
    } finally {
      setPushEnabled(false);
    }
  };

  // ─── In-dashboard badges: pending orders + unread chat since last visit ───
  useEffect(() => {
    if (!authed) return;
    const canSeeOrders = role === 'owner' || myPerms.includes('orders');
    const refresh = async () => {
      try {
        if (canSeeOrders) {
          const r = await cms('cms_orders_list', { limit: 100 });
          setPendingOrders((r?.orders || []).filter((o: any) => o.status === 'pending').length);
        }
        const c = await cms('chat_list');
        const total = (c?.messages || []).length;
        const seen = Number(localStorage.getItem('pts_chat_seen_count') || 0);
        setUnreadChat(Math.max(0, total - seen));
      } catch { /* silent — badges are best-effort */ }
    };
    refresh();
    const id = setInterval(refresh, 45000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, role, myPerms]);

  const openTab = (id: string) => {
    setTab(id);
    if (id === 'chat') {
      cms('chat_list').then((c) => localStorage.setItem('pts_chat_seen_count', String((c?.messages || []).length))).then(() => setUnreadChat(0)).catch(() => {});
    }
  };


  const loadOwnerExtras = async () => {
    const r = await cms('cms_notification_recipients_list');
    setRecipients(r?.recipients || []);
    const a = await cms('list_admins'); setAdmins(a?.admins || []);
  };
  useEffect(() => { if (authed && role === 'owner') loadOwnerExtras(); }, [authed, role]);

  const togglePurpose = (p: string) =>
    setNPurpose((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const [recErr, setRecErr] = useState('');
  const addRecipient = async () => {
    if (!nValue || recipients.filter((r) => r.type === nType).length >= 5) return;
    setRecErr('');
    const r = await cms('cms_notification_recipient_save', { type: nType, value: nValue, label: nLabel || null, api_key: nType === 'whatsapp' ? nKey || null : null, purpose: nPurpose.length ? nPurpose : ['orders'] });
    if (r?.ok === false) { setRecErr(r?.error || 'Could not add recipient.'); return; }
    setNValue(''); setNLabel(''); setNKey(''); setNPurpose(['orders']); loadOwnerExtras();
  };
  const setPurposeFor = async (r: any, purpose: string[]) => { await cms('cms_notification_recipient_update', { id: r.id, purpose: purpose.length ? purpose : ['orders'] }); loadOwnerExtras(); };

  const toggle = async (r: any) => { await cms('cms_notification_recipient_update', { id: r.id, enabled: !r.enabled }); loadOwnerExtras(); };
  const delRec = async (id: string) => { await cms('cms_notification_recipient_delete', { id }); loadOwnerExtras(); };

  const createAdmin = async () => {
    if (!newAdmin.username.trim() || !newAdmin.password.trim()) {
      setAdminMsg({ type: 'err', text: 'Username and password are required.' });
      return;
    }
    setCreatingAdmin(true); setAdminMsg(null);
    try {
      const res = await cms('create_admin', { newUsername: newAdmin.username.trim(), newPassword: newAdmin.password, permissions: adminPerms });
      // The function returns the authoritative admins list — render it directly.
      if (Array.isArray(res?.admins)) setAdmins(res.admins);
      else if (res?.admin) setAdmins((prev) => [...prev.filter((x) => x.id !== res.admin.id), res.admin]);
      setNewAdmin({ username: '', password: '' });
      setAdminPerms(['products', 'orders']);
      setAdminMsg({ type: 'ok', text: `Admin "${(res?.admin?.username) || newAdmin.username.trim()}" created.` });
    } catch (e: any) {
      setAdminMsg({ type: 'err', text: e?.message || 'Could not create admin.' });
    } finally {
      setCreatingAdmin(false);
      setTimeout(() => setAdminMsg(null), 4000);
    }
  };


  const togglePerm = async (a: any, p: string) => {
    const cur = a.permissions || [];
    const next = cur.includes(p) ? cur.filter((x: string) => x !== p) : [...cur, p];
    await cms('set_admin_permissions', { adminId: a.id, permissions: next }); loadOwnerExtras();
  };

  const adminStatus = async (adminId: string, status: string) => { const r = await cms('set_admin_status', { adminId, status }); if (Array.isArray(r?.admins)) setAdmins(r.admins); else loadOwnerExtras(); };
  const deleteAdmin = async (adminId: string) => { if (!window.confirm('Delete this admin permanently?')) return; const r = await cms('delete_admin', { adminId }); if (Array.isArray(r?.admins)) setAdmins(r.admins); else loadOwnerExtras(); };
  const setAdminPassword = async (adminId: string) => {
    const np = (pwDrafts[adminId] || '').trim();
    if (np.length < 4) { setAdminMsg({ type: 'err', text: 'Password must be at least 4 characters.' }); setTimeout(() => setAdminMsg(null), 3000); return; }
    try { const r = await cms('set_admin_password', { adminId, newPassword: np }); if (Array.isArray(r?.admins)) setAdmins(r.admins); setPwDrafts((p) => ({ ...p, [adminId]: '' })); setPwSaved(adminId); setTimeout(() => setPwSaved(null), 2000); }
    catch (e: any) { setAdminMsg({ type: 'err', text: e?.message || 'Could not change password.' }); setTimeout(() => setAdminMsg(null), 3000); }
  };

  if (restoring && !authed) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#FF6A00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) {
    if (portal === 'admin') {
      // ─── STAFF ADMIN PORTAL — cool indigo/teal identity, distinct from owner ───
      return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-[#0B1120] via-[#111C34] to-[#0B1120] relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#3B82F6]/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#06B6D4]/20 blur-3xl" />
          <form onSubmit={login} className="relative w-full max-w-sm">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] flex items-center justify-center mb-5 shadow-lg shadow-[#3B82F6]/30">
                <ShieldCheck className="text-white" size={26} />
              </div>
              <span className="inline-block text-[10px] tracking-[0.3em] uppercase text-[#5EE0E0] mb-2">Staff Access</span>
              <h1 className="font-serif text-2xl text-white mb-1">Admin Portal</h1>
              <p className="text-[#9FB0CC] text-sm mb-7">Sign in with the username &amp; passphrase your owner created for you.</p>
              <input value={creds.username} onChange={(e) => setCreds({ ...creds, username: e.target.value })} placeholder="Admin username" autoCapitalize="none" autoCorrect="off" className="w-full bg-[#0B1120]/60 border border-white/15 text-white px-4 py-3 mb-3 outline-none focus:border-[#06B6D4] rounded-lg placeholder:text-[#6B7B99]" />
              <input type="password" value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} placeholder="Passphrase" className="w-full bg-[#0B1120]/60 border border-white/15 text-white px-4 py-3 mb-4 outline-none focus:border-[#06B6D4] rounded-lg placeholder:text-[#6B7B99]" />
              {err && <p className="text-red-300 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-lg py-2 px-3">{err}</p>}
              <button disabled={loading} className="w-full bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] text-white py-3 text-xs tracking-[0.25em] uppercase font-medium disabled:opacity-50 rounded-lg hover:opacity-90 transition">{loading ? 'Verifying…' : 'Sign in'}</button>
              <p className="text-[#5B6B88] text-[11px] mt-5">Staff workspace · PITSIKY Maison</p>
            </div>
          </form>
        </div>
      );
    }
    // ─── OWNER CONSOLE — warm amber identity, private to the owner ───
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-[#150A02] via-[#1E0F03] to-[#0F0F0F] relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#FF6A00]/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[#E04E00]/20 blur-3xl" />
        <form onSubmit={login} className="relative w-full max-w-sm">
          <div className="bg-white/5 backdrop-blur-xl border border-[#FF6A00]/20 rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-[#FF6A00] to-[#E04E00] flex items-center justify-center mb-5 shadow-lg shadow-[#FF6A00]/30">
              <Lock className="text-white" size={24} />
            </div>
            <span className="inline-block text-[10px] tracking-[0.3em] uppercase text-[#FFB36B] mb-2">Private</span>
            <h1 className="font-serif text-2xl text-white mb-1">PITS<span className="text-[#FF6A00]">IKY</span> Owner Console</h1>
            <p className="text-[#9c8a7a] text-sm mb-7">Owner-only access. You stay signed in until you sign out.</p>
            <input value={creds.username} onChange={(e) => setCreds({ ...creds, username: e.target.value })} placeholder="Phone number" className="w-full bg-[#0F0F0F]/70 border border-white/15 text-white px-4 py-3 mb-3 outline-none focus:border-[#FF6A00] rounded-lg placeholder:text-[#7a6a5a]" />
            <input type="password" value={creds.password} onChange={(e) => setCreds({ ...creds, password: e.target.value })} placeholder="Passphrase" className="w-full bg-[#0F0F0F]/70 border border-white/15 text-white px-4 py-3 mb-4 outline-none focus:border-[#FF6A00] rounded-lg placeholder:text-[#7a6a5a]" />
            {err && <p className="text-red-300 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-lg py-2 px-3">{err}</p>}
            <button disabled={loading} className="w-full bg-gradient-to-r from-[#FF6A00] to-[#E04E00] text-white py-3 text-xs tracking-[0.25em] uppercase font-medium disabled:opacity-50 rounded-lg hover:opacity-90 transition">{loading ? 'Verifying…' : 'Enter console'}</button>
          </div>
        </form>
      </div>
    );
  }

  const allTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, owner: true },
    { id: 'products', label: 'Products', icon: Package, owner: false, perm: 'products' },
    { id: 'categories', label: 'Categories', icon: FolderTree, owner: true },
    { id: 'media', label: 'Media', icon: Image, owner: true },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, owner: false, perm: 'orders' },
    { id: 'chat', label: 'Team Chat', icon: MessageSquare, owner: false },
    { id: 'customers', label: 'Customers', icon: Users, owner: true },
    { id: 'notify', label: 'Notifications', icon: Bell, owner: true },
    { id: 'settings', label: 'Settings', icon: Settings, owner: true },
    { id: 'affiliates', label: 'Affiliators', icon: Briefcase, owner: true },
    { id: 'activity', label: 'Activity Log', icon: Activity, owner: true },
    { id: 'admins', label: 'Admins', icon: ShieldCheck, owner: true },
  ];
  // Owner sees everything. An admin only sees a tab when it isn't owner-exclusive
  // AND (it needs no specific permission, or they were actually granted it).
  const tabs = allTabs.filter((t) => role === 'owner' || (!t.owner && (!t.perm || myPerms.includes(t.perm))));

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex">
      <aside className="w-56 bg-[#1D1D1D] text-white min-h-screen p-5 hidden md:block">
        <div className="mb-6"><h1 className="font-serif text-xl">PITSIKY</h1><span className="text-[10px] tracking-[0.2em] uppercase text-[#6E44FF]">{role} console</span></div>
        {identity && (
          <div className="flex items-center gap-2.5 mb-6 p-2.5 rounded-lg bg-white/5">
            <span className="w-9 h-9 rounded-full flex items-center justify-center text-lg" style={{ background: `${identity.color}22`, border: `1.5px solid ${identity.color}` }}>{identity.emoji}</span>
            <div className="leading-tight">
              <p className="text-sm font-medium" style={{ color: identity.color }}>{identity.display_name}</p>
              <button onClick={() => setTab('chat')} className="text-[10px] uppercase tracking-wide text-[#888] hover:text-white">Edit identity</button>
            </div>
          </div>
        )}
        <nav className="space-y-1">
          {tabs.map((t) => {
            const badge = t.id === 'orders' ? pendingOrders : t.id === 'chat' ? unreadChat : 0;
            return (
              <button key={t.id} onClick={() => openTab(t.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded ${tab === t.id ? 'bg-[#6E44FF] text-white' : 'text-[#aaa] hover:text-white'}`}>
                <t.icon size={16} /> {t.label}
                {badge > 0 && <span className="ml-auto text-[10px] font-semibold bg-[#FF6A00] text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{badge > 99 ? '99+' : badge}</span>}
              </button>
            );
          })}
        </nav>
        <button
          onClick={pushEnabled ? disablePush : enablePush}
          className={`mt-4 w-full flex items-center gap-2 px-3 py-2.5 text-xs rounded border transition ${pushEnabled ? 'border-[#6E44FF] text-[#6E44FF] bg-[#6E44FF]/10' : 'border-white/15 text-[#aaa] hover:text-white'}`}
        >
          <Bell size={14} /> {pushEnabled ? 'Alerts on' : 'Enable alerts'}
        </button>
        <button onClick={() => { setAuthed(false); localStorage.removeItem(AUTH_KEY); localStorage.removeItem('pts_auth'); localStorage.removeItem('pts_role'); localStorage.removeItem('pts_identity'); setCreds({ username: '', password: '' }); }} className="mt-8 text-xs tracking-[0.15em] uppercase text-[#666] hover:text-white">Sign Out</button>
      </aside>

      <main className="flex-1 p-6 lg:p-10 overflow-x-hidden">
        <div className="md:hidden flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((t) => {
            const badge = t.id === 'orders' ? pendingOrders : t.id === 'chat' ? unreadChat : 0;
            return (
              <button key={t.id} onClick={() => openTab(t.id)} className={`relative px-4 py-2 text-xs uppercase whitespace-nowrap ${tab === t.id ? 'bg-[#1D1D1D] text-white' : 'bg-[#F2ECE6]'}`}>
                {t.label}
                {badge > 0 && <span className="absolute -top-1.5 -right-1.5 text-[9px] font-semibold bg-[#FF6A00] text-white rounded-full px-1 min-w-[16px] text-center">{badge > 99 ? '99+' : badge}</span>}
              </button>
            );
          })}
        </div>
        <h2 className="font-serif text-3xl mb-8 capitalize">{tabs.find((t) => t.id === tab)?.label}</h2>

        {tab === 'dashboard' && role === 'owner' && <AnalyticsPanel />}
        {tab === 'products' && (role === 'owner' || myPerms.includes('products')) && <ProductsPanel />}
        {tab === 'categories' && role === 'owner' && <CategoriesPanel />}
        {tab === 'media' && role === 'owner' && <MediaPanel />}
        {tab === 'orders' && (role === 'owner' || myPerms.includes('orders')) && <OrdersPanel />}
        {tab === 'customers' && role === 'owner' && <CustomersPanel />}
        {tab === 'settings' && role === 'owner' && <SettingsPanel />}
        {tab === 'affiliates' && role === 'owner' && <AffiliatesPanel />}
        {tab === 'activity' && role === 'owner' && <ActivityPanel />}

        {tab === 'chat' && (
          <div>
            {/* Identity editor */}
            <div className="bg-white border border-[#eee] rounded-xl p-6 mb-6">
              <h3 className="font-serif text-xl mb-1">Your identity in chat</h3>
              <p className="text-sm text-[#8D8D8D] mb-5">Pick the name, colour and emoji your teammates will see.</p>
              <div className="flex flex-wrap items-end gap-6">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-inner" style={{ background: `${idForm.color}22`, border: `2px solid ${idForm.color}` }}>{idForm.emoji}</span>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wide text-[#9b8a5a] mb-1">Display name</label>
                    <input value={idForm.display_name} onChange={(e) => setIdForm({ ...idForm, display_name: e.target.value })} placeholder="e.g. Yassine" className="border border-[#ddd] rounded-lg px-3 py-2 text-sm w-44 outline-none focus:border-[#7C3AED]" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wide text-[#9b8a5a] mb-1.5">Colour</label>
                  <div className="flex gap-1.5">
                    {CHAT_COLORS.map((c) => (
                      <button key={c} onClick={() => setIdForm({ ...idForm, color: c })} className={`w-7 h-7 rounded-full transition-transform ${idForm.color === c ? 'ring-2 ring-offset-2 ring-[#1D1D1D] scale-110' : ''}`} style={{ background: c }} aria-label={c} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wide text-[#9b8a5a] mb-1.5">Emoji</label>
                  <div className="flex flex-wrap gap-1 max-w-[260px]">
                    {CHAT_EMOJIS.map((em) => (
                      <button key={em} onClick={() => setIdForm({ ...idForm, emoji: em })} className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition ${idForm.emoji === em ? 'bg-[#F2ECE6] ring-2 ring-[#7C3AED]' : 'hover:bg-[#f5f5f5]'}`}>{em}</button>
                    ))}
                  </div>
                </div>
                <button onClick={saveIdentity} className="btn-aurora px-5 py-2.5 text-sm flex items-center gap-2">
                  {idSaved ? <><Check size={15} /> Saved</> : 'Save identity'}
                </button>
              </div>
              {idErr && <p className="mt-3 text-sm text-red-500">{idErr}</p>}

            </div>

            <ChatPanel />
          </div>
        )}

        {tab === 'notify' && role === 'owner' && (
          <div>
            <div className="bg-white border border-[#eee] p-6 mb-8">
              <h3 className="font-serif text-xl mb-2">Add Recipient (max 5 per channel)</h3>
              <p className="text-sm text-[#8D8D8D] mb-4">Choose which streams each contact receives: Orders, Consultations and Subscriptions.</p>
              <div className="flex flex-wrap gap-3 items-center mb-4">
                <select value={nType} onChange={(e) => setNType(e.target.value as any)} className="border border-[#ddd] px-3 py-2"><option value="email">Email</option><option value="whatsapp">WhatsApp</option></select>
                <input value={nValue} onChange={(e) => setNValue(e.target.value)} placeholder={nType === 'email' ? 'email@…' : '212600000000'} className="border border-[#ddd] px-3 py-2 flex-1 min-w-48" />
                <input value={nLabel} onChange={(e) => setNLabel(e.target.value)} placeholder="Label" className="border border-[#ddd] px-3 py-2 w-32" />
                {nType === 'whatsapp' && <input value={nKey} onChange={(e) => setNKey(e.target.value)} placeholder="CallMeBot API key" className="border border-[#ddd] px-3 py-2 w-44" />}
                <button onClick={addRecipient} className="bg-[#6E44FF] text-white px-4 py-2 flex items-center gap-1 text-sm"><Plus size={15} /> Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {['orders', 'consultation', 'subscription'].map((p) => (
                  <button key={p} type="button" onClick={() => togglePurpose(p)} className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wide border ${nPurpose.includes(p) ? 'bg-[#6E44FF] text-white border-[#6E44FF]' : 'border-[#ddd] text-[#777]'}`}>{p}</button>
                ))}
              </div>
              {recErr && <p className="mt-3 text-sm text-red-500">{recErr}</p>}
            </div>
            <div className="space-y-2">
              {recipients.map((r) => (
                <div key={r.id} className="bg-white border border-[#eee] p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1 min-w-48">
                    <span className="text-[10px] tracking-[0.15em] uppercase text-[#6E44FF] mr-3">{r.type}</span>
                    <span className="font-medium">{r.value}</span>
                    {r.label && <span className="text-sm text-[#8D8D8D] ml-2">({r.label})</span>}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {['orders', 'consultation', 'subscription'].map((p) => {
                        const on = (r.purpose || ['orders']).includes(p);
                        return (
                          <button key={p} onClick={() => setPurposeFor(r, on ? (r.purpose || []).filter((x: string) => x !== p) : [...(r.purpose || []), p])} className={`px-3 py-0.5 rounded-full text-[10px] uppercase tracking-wide border ${on ? 'bg-[#F2ECE6] border-[#6E44FF] text-[#6E44FF]' : 'border-[#eee] text-[#bbb]'}`}>{p}</button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => toggle(r)}>{r.enabled ? <ToggleRight className="text-[#6E44FF]" /> : <ToggleLeft className="text-[#bbb]" />}</button>
                    <button onClick={() => delRec(r.id)} className="text-[#ccc] hover:text-red-500"><Trash2 size={17} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {tab === 'admins' && role === 'owner' && (
          <div>
            <div className="bg-white border border-[#eee] rounded-xl p-6 mb-8">
              <h3 className="font-serif text-xl mb-1">Create Admin</h3>
              <p className="text-sm text-[#8D8D8D] mb-5">Pick the role this admin gets. Deletion &amp; settings always stay exclusively with the Owner.</p>

              <div className="grid sm:grid-cols-2 gap-3 mb-5 max-w-md">
                <input value={newAdmin.username} onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })} placeholder="Username" className="border border-[#ddd] rounded-lg px-3 py-2.5 text-sm" />
                <input type="password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} placeholder="Password" className="border border-[#ddd] rounded-lg px-3 py-2.5 text-sm" />
              </div>

              <label className="block text-[11px] uppercase tracking-wide text-[#9b8a5a] mb-2">Role / access</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { label: 'Products only', perms: ['products'] },
                  { label: 'Orders only', perms: ['orders'] },
                  { label: 'Products + Orders', perms: ['products', 'orders'] },
                ].map((opt) => {
                  const active = adminPerms.length === opt.perms.length && opt.perms.every((p) => adminPerms.includes(p));
                  return (
                    <button key={opt.label} type="button" onClick={() => setAdminPerms(opt.perms)} className={`px-4 py-2 rounded-full text-xs uppercase tracking-wide border transition ${active ? 'bg-[#6E44FF] text-white border-[#6E44FF]' : 'border-[#ddd] text-[#777] hover:border-[#6E44FF]'}`}>{opt.label}</button>
                  );
                })}
              </div>


              <button onClick={createAdmin} disabled={creatingAdmin || !newAdmin.username || !newAdmin.password || adminPerms.length === 0} className="bg-[#6E44FF] text-white px-5 py-2.5 rounded-lg flex items-center gap-1.5 text-sm disabled:opacity-50"><UserPlus size={15} /> {creatingAdmin ? 'Creating…' : 'Create admin'}</button>
              {adminMsg && (
                <p className={`mt-3 text-sm ${adminMsg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>{adminMsg.text}</p>
              )}

            </div>

            <div className="space-y-2">
              {admins.length === 0 && <p className="text-[#8D8D8D]">No admins yet.</p>}
              {admins.map((a) => (
                <div key={a.id} className="bg-white border border-[#eee] rounded-xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-full flex items-center justify-center text-lg" style={{ background: `${a.color || '#ddd'}22`, border: `1.5px solid ${a.color || '#ccc'}` }}>{a.emoji || '🦊'}</span>
                      <div>
                        <span className="font-medium" style={{ color: a.color || '#222' }}>{a.display_name || a.username}</span>
                        <span className="text-xs text-[#aaa] ml-2">@{a.username}</span>
                        <span className={`text-xs ml-3 font-medium ${a.status === 'active' ? 'text-green-600' : a.status === 'blocked' ? 'text-red-500' : 'text-amber-600'}`}>{a.status}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {['products', 'orders'].map((p) => {
                        const on = (a.permissions || []).includes(p);
                        return (
                          <button key={p} onClick={() => togglePerm(a, p)} className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wide border transition ${on ? 'bg-[#F2ECE6] border-[#6E44FF] text-[#6E44FF]' : 'border-[#eee] text-[#bbb] hover:border-[#6E44FF]'}`}>{p}</button>
                        );
                      })}
                    </div>

                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#f2f2f2]">
                    {/* Status controls */}
                    <button onClick={() => adminStatus(a.id, 'active')} disabled={a.status === 'active'} className={`px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wide border ${a.status === 'active' ? 'bg-green-50 border-green-200 text-green-600' : 'border-[#ddd] text-[#666] hover:border-green-400'}`}>Active</button>
                    <button onClick={() => adminStatus(a.id, 'suspended')} disabled={a.status === 'suspended'} className={`px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wide border ${a.status === 'suspended' ? 'bg-amber-50 border-amber-200 text-amber-600' : 'border-[#ddd] text-[#666] hover:border-amber-400'}`}>Suspend</button>
                    <button onClick={() => adminStatus(a.id, 'blocked')} disabled={a.status === 'blocked'} className={`px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wide border ${a.status === 'blocked' ? 'bg-red-50 border-red-200 text-red-500' : 'border-[#ddd] text-[#666] hover:border-red-400'}`}>Block</button>

                    {/* Change password */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <input type="text" value={pwDrafts[a.id] || ''} onChange={(e) => setPwDrafts((p) => ({ ...p, [a.id]: e.target.value }))} placeholder="New password" className="border border-[#ddd] rounded-lg px-3 py-1.5 text-sm w-40" />
                      <button onClick={() => setAdminPassword(a.id)} disabled={!(pwDrafts[a.id] || '').trim()} className="bg-[#1D1D1D] text-white px-3 py-1.5 rounded-lg text-[11px] uppercase tracking-wide disabled:opacity-40 flex items-center gap-1">{pwSaved === a.id ? <><Check size={13} /> Set</> : 'Change'}</button>
                    </div>
                    <button onClick={() => deleteAdmin(a.id)} className="text-[#ccc] hover:text-red-500" title="Delete admin"><Trash2 size={17} /></button>
                  </div>
                </div>
              ))}

            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default OwnerAdmin;
