import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useI18n } from '@/contexts/I18nContext';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface ProductReviewsProps {
  productId: string;
}

/**
 * قسم تقييمات العملاء بالنجوم أسفل صفحة المنتج. يقرأ ويكتب في جدول
 * `ecom_product_reviews` (انظر migration المرافق). إذا لم يكن الجدول
 * موجوداً بعد في قاعدة البيانات، يختفي القسم بهدوء دون كسر الصفحة.
 *
 * Star-rating customer reviews section below the product page. Reads
 * from and writes to `ecom_product_reviews` (see the accompanying
 * migration). If the table doesn't exist yet, the section quietly hides
 * itself instead of breaking the page.
 */
const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const { lang } = useI18n();
  const en = lang === 'en';

  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [tableMissing, setTableMissing] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverStar, setHoverStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from('ecom_product_reviews' as any)
      .select('*')
      .eq('product_id', productId)
      .eq('approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      // الجدول غير موجود بعد — نخفي القسم بدلاً من إظهار خطأ للزائر
      // Table not created yet — hide the section instead of showing an error
      setTableMissing(true);
      return;
    }
    setReviews((data as any) || []);
  };

  useEffect(() => {
    if (productId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const avg = reviews && reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('ecom_product_reviews' as any).insert({
      product_id: productId,
      customer_name: name.trim(),
      rating,
      comment: comment.trim() || null,
    } as any);
    setSubmitting(false);
    if (!error) {
      setSubmitted(true);
      setName('');
      setComment('');
      setRating(5);
      load();
    }
  };

  if (tableMissing) return null;

  return (
    <div className="mt-14 border-t border-[#eee] dark:border-[#222] pt-10">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-serif text-2xl text-[#1D1D1D] dark:text-[#F4F1E9]">
          {en ? 'Customer Reviews' : 'آراء العملاء'}
        </h2>
        {reviews && reviews.length > 0 && (
          <span className="flex items-center gap-1 text-sm text-[#8D8D8D]">
            <Star size={14} className="text-[#FF6A00]" fill="currentColor" />
            {avg.toFixed(1)} · {reviews.length} {en ? 'reviews' : 'تقييم'}
          </span>
        )}
      </div>

      {reviews && reviews.length > 0 ? (
        <div className="space-y-5 mb-10">
          {reviews.map((r) => (
            <div key={r.id} className="p-4 rounded-lg border border-[#eee] dark:border-[#222]">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm text-[#1D1D1D] dark:text-[#F4F1E9]">{r.customer_name}</p>
                <div className="flex text-[#FF6A00]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} fill={i < r.rating ? 'currentColor' : 'none'} />
                  ))}
                </div>
              </div>
              {r.comment && <p className="text-sm text-[#6b6b6b] mt-2 leading-relaxed">{r.comment}</p>}
            </div>
          ))}
        </div>
      ) : (
        reviews && (
          <p className="text-sm text-[#8D8D8D] mb-8">
            {en ? 'Be the first to review this piece.' : 'كن أول من يقيّم هذه القطعة.'}
          </p>
        )
      )}

      {submitted ? (
        <p className="text-sm text-[#1faa52]">
          {en ? 'Thank you — your review has been posted!' : 'شكراً — تم نشر تقييمك!'}
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-3 max-w-md">
          <p className="text-xs tracking-[0.15em] uppercase text-[#8D8D8D]">
            {en ? 'Write a review' : 'اكتب تقييمك'}
          </p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHoverStar(n)}
                onMouseLeave={() => setHoverStar(0)}
                onClick={() => setRating(n)}
                aria-label={`${n} star`}
              >
                <Star
                  size={22}
                  className="text-[#FF6A00]"
                  fill={n <= (hoverStar || rating) ? 'currentColor' : 'none'}
                />
              </button>
            ))}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder={en ? 'Your name' : 'اسمك'}
            className="w-full px-4 py-2.5 rounded-lg border border-[#e0d8cf] dark:border-[#222] bg-white dark:bg-[#121212] text-sm outline-none focus:border-[#FF6A00]"
          />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder={en ? 'Share your experience (optional)' : 'شارك تجربتك (اختياري)'}
            className="w-full px-4 py-2.5 rounded-lg border border-[#e0d8cf] dark:border-[#222] bg-white dark:bg-[#121212] text-sm outline-none focus:border-[#FF6A00]"
          />
          <button
            disabled={submitting}
            className="px-6 py-2.5 text-xs tracking-[0.2em] uppercase bg-[#1D1D1D] text-white rounded-lg hover:bg-[#FF6A00] transition-colors disabled:opacity-50"
          >
            {submitting ? (en ? 'Posting…' : 'جارٍ النشر…') : (en ? 'Submit Review' : 'إرسال التقييم')}
          </button>
        </form>
      )}
    </div>
  );
};

export default ProductReviews;
