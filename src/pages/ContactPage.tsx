import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Check } from 'lucide-react';
import Shell from '@/components/Shell';
import { useI18n } from '@/contexts/I18nContext';
import { crmSubscribe } from '@/lib/constants';

const ContactPage: React.FC = () => {
  const { lang } = useI18n();
  const en = lang === 'en';
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [smsOptIn, setSmsOptIn] = useState(true);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) return;
    setLoading(true);
    await crmSubscribe({
      email: form.email,
      name: form.name || undefined,
      phone: form.phone || undefined,
      sms_opt_in: smsOptIn === true,
      source: 'contact-form',
      tags: ['contact'],
      note: form.message || undefined,
    });
    setLoading(false);
    setSent(true);
  };


  const input = 'w-full px-4 py-3 rounded-lg border border-[#e0d8cf] dark:border-[#222] bg-white dark:bg-[#121212] text-[#141414] dark:text-[#F4F1E9] outline-none focus:border-[#FF6A00]';

  return (
    <Shell>
      <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-16">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.3em] uppercase text-[#FF6A00] mb-3">{en ? 'We’d love to hear from you' : 'يسعدنا تواصلك'}</p>
          <h1 className="font-serif text-4xl md:text-5xl text-[#1D1D1D] dark:text-[#F4F1E9]">{en ? 'Contact Us' : 'اتصل بنا'}</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-5">
            <a href="https://wa.me/+212702382376" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#121212] border border-[#eee] dark:border-[#1f1f1f] lux-card">
              <span className="w-11 h-11 rounded-full bg-[#25D366]/15 flex items-center justify-center"><Phone size={19} className="text-[#1faa52]" /></span>
              <div><p className="font-medium text-[#1D1D1D] dark:text-[#F4F1E9]">WhatsApp</p><p className="text-sm text-[#7a7a7a]">+212 702 382 376</p></div>
            </a>
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#121212] border border-[#eee] dark:border-[#1f1f1f]">
              <span className="w-11 h-11 rounded-full bg-[#FF6A00]/12 flex items-center justify-center"><Mail size={19} className="text-[#FF6A00]" /></span>
              <div><p className="font-medium text-[#1D1D1D] dark:text-[#F4F1E9]">Email</p><p className="text-sm text-[#7a7a7a]">hello@pitsiky.com</p></div>
            </div>
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#121212] border border-[#eee] dark:border-[#1f1f1f]">
              <span className="w-11 h-11 rounded-full bg-[#FF6A00]/12 flex items-center justify-center"><MapPin size={19} className="text-[#FF6A00]" /></span>
              <div><p className="font-medium text-[#1D1D1D] dark:text-[#F4F1E9]">{en ? 'Atelier' : 'الأتيليه'}</p><p className="text-sm text-[#7a7a7a]">Morocco</p></div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#121212] border border-[#eee] dark:border-[#1f1f1f] rounded-2xl p-7">
            {sent ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#FF6A00]/12 flex items-center justify-center mb-4"><Check size={26} className="text-[#FF6A00]" /></div>
                <h3 className="font-serif text-xl mb-2 text-[#1D1D1D] dark:text-[#F4F1E9]">{en ? 'Message received!' : 'تم استلام رسالتك!'}</h3>
                <p className="text-sm text-[#7a7a7a]">{en ? 'Our team will reach out shortly.' : 'سنتواصل معك قريبًا.'}</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <input className={input} placeholder={en ? 'Your name' : 'الاسم'} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input className={input} type="email" required placeholder={en ? 'Email' : 'البريد الإلكتروني'} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <input className={input} type="tel" placeholder={en ? 'Phone number (optional)' : 'رقم الهاتف (اختياري)'} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <textarea className={input} rows={4} placeholder={en ? 'How can we help?' : 'كيف يمكننا مساعدتك؟'} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                <label className="flex items-start gap-2 text-xs text-[#7a7a7a]">
                  <input type="checkbox" checked={smsOptIn} onChange={(e) => setSmsOptIn(e.target.checked)} className="mt-0.5" />
                  <span>{en ? 'Text me updates. Msg & data rates may apply. Reply STOP to unsubscribe.' : 'أرسل لي التحديثات عبر الرسائل. قد تُطبق رسوم.'}</span>
                </label>
                <button disabled={loading} className="btn-pk w-full py-3.5 text-sm uppercase flex items-center justify-center gap-2 disabled:opacity-60">
                  <Send size={16} /> {loading ? (en ? 'Sending…' : 'جارٍ الإرسال…') : (en ? 'Send Message' : 'إرسال')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default ContactPage;
