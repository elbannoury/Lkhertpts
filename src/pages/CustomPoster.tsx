import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { crmSubscribe } from '@/lib/constants';


const TYPES = ['سيارة 🏎️', 'كرتون 🦸', 'آية قرآنية 🕌', 'كرة القدم ⚽', 'طبيعة 🌿', 'لوحة سيارتك (Plate)', 'تصميم آخر'];
const SIZES = ['A3 · 30×42', 'A2 · 42×60', 'A1 · 60×84', 'مخصص'];

const CustomPoster: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', poster_type: TYPES[0], size: SIZES[1], budget: '', idea: '' });
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.idea.trim() || !form.email.trim()) {
      setError('من فضلك أدخل بريدك ووصف الفكرة.');
      return;
    }
    setLoading(true);
    try {
      let reference_url: string | null = null;
      if (file) {
        const path = `poster-requests/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const { error: upErr } = await supabase.storage.from('pts-media').upload(path, file, { upsert: true });
        if (!upErr) {
          reference_url = supabase.storage.from('pts-media').getPublicUrl(path).data.publicUrl;
        }
      }

      await supabase.from('pts_poster_requests').insert({
        name: form.name || null,
        email: form.email,
        phone: form.phone || null,
        poster_type: form.poster_type,
        size: form.size,
        budget: form.budget || null,
        idea: form.idea,
        reference_url,
      });

      // CRM subscribe (correct project id via shared helper)
      crmSubscribe({
        email: form.email,
        name: form.name || undefined,
        phone: form.phone || undefined,
        sms_opt_in: smsOptIn === true,
        source: 'custom-poster',
        tags: ['custom-design', 'poster-request'],
        note: form.idea || undefined,
      });


      setDone(true);
    } catch (err: any) {
      setError('حدث خطأ، حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full bg-white/5 border border-[#E5B53C]/25 rounded-xl px-4 py-3 text-[#F4F1E9] placeholder:text-white/40 outline-none focus:border-[#1FBF6B] focus:ring-2 focus:ring-[#1FBF6B]/30 transition';

  return (
    <div className="min-h-screen bg-[#0A0E0C] text-[#F4F1E9]" dir="rtl">
      <Header />
      {/* hero */}
      <section className="relative mesh-bg py-24 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="deer-bob text-5xl">🦌</span>
          <p className="mt-4 text-xs tracking-[0.35em] uppercase text-[#1FBF6B]">PITSIKY · CUSTOM STUDIO</p>
          <h1 className="font-serif text-4xl md:text-6xl mt-3 pk-grad-text">باغي تصميم مخصص؟</h1>
          <p className="text-white/75 max-w-xl mx-auto mt-5 text-lg">
            عبّر على الفكرة لي فراسك، وحنا نحوّلوها ليك لوحة فنية فاخرة بخامات عالية الجودة. شاركنا التفاصيل و رينا الإلهام ديالك 👇
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16">
        {done ? (
          <div className="glass-dark rounded-2xl p-10 text-center">
            <span className="text-5xl deer-bob inline-block">🎉</span>
            <h2 className="font-serif text-3xl mt-4 pk-grad-text">توصّلنا بفكرتك!</h2>
            <p className="text-white/75 mt-4">غادي نتواصلو معاك قريباً باش نكمّلو التفاصيل. تقدر تسرّع الأمور عبر الواتساب.</p>
            <div className="flex flex-wrap gap-4 justify-center mt-8">
              <a href="https://wa.me/+212702382376" target="_blank" rel="noopener noreferrer" className="btn-wa px-7 py-3 text-sm">
                تواصل عبر واتساب
              </a>
              <Link to="/" className="btn-pk-ghost px-7 py-3 text-sm">العودة للرئيسية</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="glass-dark rounded-2xl p-7 md:p-10 space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-[#1FBF6B] mb-2 block">الاسم</label>
                <input className={inputCls} placeholder="اسمك الكريم" value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-[#1FBF6B] mb-2 block">البريد الإلكتروني *</label>
                <input type="email" required className={inputCls} placeholder="example@mail.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-[#1FBF6B] mb-2 block">رقم الهاتف (اختياري)</label>
                <input type="tel" className={inputCls} placeholder="06xxxxxxxx" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-[#1FBF6B] mb-2 block">الميزانية التقريبية (اختياري)</label>
                <input className={inputCls} placeholder="مثال: 400 درهم" value={form.budget} onChange={(e) => set('budget', e.target.value)} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs text-[#1FBF6B] mb-2 block">نوع التصميم</label>
                <select className={inputCls} value={form.poster_type} onChange={(e) => set('poster_type', e.target.value)}>
                  {TYPES.map((t) => <option key={t} className="bg-[#0A0E0C]" value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#1FBF6B] mb-2 block">المقاس</label>
                <select className={inputCls} value={form.size} onChange={(e) => set('size', e.target.value)}>
                  {SIZES.map((s) => <option key={s} className="bg-[#0A0E0C]" value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-[#1FBF6B] mb-2 block">اشرح فكرتك بالتفصيل *</label>
              <textarea
                required rows={5} className={inputCls}
                placeholder="وصف الألوان، الأسلوب، الكلمات أو الآية، الصورة لي بغيتي... كل التفاصيل لي تخطر فبالك."
                value={form.idea} onChange={(e) => set('idea', e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-[#1FBF6B] mb-2 block">صورة مرجعية (اختياري)</label>
              <div className="flex items-center gap-4">
                <label className="btn-pk-ghost px-5 py-3 text-sm cursor-pointer">
                  اختر صورة
                  <input type="file" accept="image/*" className="hidden" onChange={onFile} />
                </label>
                {preview && (
                  <img src={preview} alt="reference" className="h-16 w-16 rounded-xl object-cover border border-[#E5B53C]/40" />
                )}
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-white/60">
              <input type="checkbox" checked={smsOptIn} onChange={(e) => setSmsOptIn(e.target.checked)} className="mt-1" />
              <span>أرسلوا لي تحديثات الطلب عبر الرسائل. قد تطبّق رسوم. أرسل STOP للإلغاء.</span>
            </label>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex flex-wrap gap-4 pt-2">
              <button type="submit" disabled={loading} className="btn-pk px-9 py-4 text-sm disabled:opacity-60">
                {loading ? 'جارٍ الإرسال…' : 'أرسل فكرتي 🦌'}
              </button>
              <a href="https://wa.me/+212702382376" target="_blank" rel="noopener noreferrer" className="btn-wa px-7 py-4 text-sm self-center">
                أو راسلنا على واتساب
              </a>
            </div>
          </form>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default CustomPoster;
