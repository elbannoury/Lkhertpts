import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MoreVertical, Edit, Trash2, Copy, X, Image as ImageIcon } from 'lucide-react';
import { formatMAD } from '@/data/catalog';
import LazyImage from '@/components/LazyImage';

interface Props {
  product: any;
  // دوال نمررها من المكون الأب لتحديث قاعدة البيانات أو الحالة العامة بدقة
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updatedData: any) => void;
  onDuplicate?: (product: any) => void;
}

const ProductCard: React.FC<Props> = ({ product, onDelete, onUpdate, onDuplicate }) => {
  const variants = product.variants || [];
  const minPrice = variants.length
    ? Math.min(...variants.map((v: any) => v.price))
    : product.price;

  // حالات التحكم في الواجهة (حالات نقية بدون مكتبات خارجية)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // حالات حقول التعديل لضمان حفظ البيانات بدقة
  const [editName, setEditName] = useState(product.name || '');
  const [editPrice, setEditPrice] = useState(minPrice || 0);
  const [editType, setEditType] = useState(product.product_type || '');

  const innerRef = useRef<HTMLDivElement>(null);

  // أنيميشن الـ 3D الخاص بك
  const handleMove = (e: React.MouseEvent) => {
    const el = innerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `rotateX(${(-py * 11).toFixed(2)}deg) rotateY(${(px * 13).toFixed(2)}deg) translateY(-8px) scale(1.02)`;
  };
  
  const handleLeave = () => {
    const el = innerRef.current;
    if (el) el.style.transform = '';
  };

  // معالجة حفظ التعديلات بدقة
  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdate) {
      onUpdate(product.id || product._id, {
        name: editName,
        price: Number(editPrice),
        product_type: editType,
        // الحفاظ على مصفوفة الصور الأصلية القادمة من الميديا بدقة متناهية
        images: product.images, 
        media_id: product.media_id,
        is_from_media: product.is_from_media
      });
    }
    setIsEditModalOpen(false);
  };

  return (
    // الحاوية الرئيسية أصبحت relative لمنع خروج القوائم وأزرار التحكم
    <div className="relative group block">
      
      {/* ================= زر الخيارات والقائمة (خارج الرابط تماماً ليعمل بحرية) ================= */}
      <div className="absolute top-3 left-3 z-30 font-sans" dir="rtl">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          className="h-9 w-9 rounded-full bg-white/90 dark:bg-black/80 text-black dark:text-white flex items-center justify-center shadow-lg border border-gray-200 dark:border-zinc-800 hover:scale-105 transition-transform"
          title="خيارات المنتج"
        >
          <MoreVertical size={16} />
        </button>

        {/* القائمة المنسدلة بتصميم Tailwind نقي */}
        {isMenuOpen && (
          <>
            {/* طبقة شفافة لإغلاق القائمة عند الضغط في أي مكان في الشاشة */}
            <div className="fixed inset-0 z-30" onClick={() => setIsMenuOpen(false)} />
            
            <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-xl z-40 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-200">
              
              {/* إشعار ذكي إذا كان المنتج تم إنشاؤه من صور الميديا */}
              {(product.is_from_media || product.media_id) && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 border-b border-gray-100 dark:border-zinc-800">
                  <ImageIcon size={12} />
                  <span>مرتبط بميديا محمية</span>
                </div>
              )}

              <button
                onClick={() => { setIsMenuOpen(false); setIsEditModalOpen(true); }}
                className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-right"
              >
                <Edit size={14} className="ml-2 text-blue-500" /> تعديل البيانات
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  if (onDuplicate) onDuplicate(product);
                }}
                className="w-full flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-right"
              >
                <Copy size={14} className="ml-2 text-emerald-500" /> تكرار (نسخ دقيق)
              </button>

              <div className="border-t border-gray-100 dark:border-zinc-800 my-1" />

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  if (confirm(`هل أنت متأكد من حذف "${product.name}" نهائياً؟`)) {
                    if (onDelete) onDelete(product.id || product._id);
                  }
                }}
                className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-right"
              >
                <Trash2 size={14} className="ml-2" /> حذف المنتج
              </button>
            </div>
          </>
        )}
      </div>

      {/* ================= رابط بطاقة الـ 3D الأصلية الخاصة بك (دون أي تعديل في تصميمك الفخم) ================= */}
      <Link to={`/products/${product.handle}`} className="card3d block">
        <div
          ref={innerRef}
          className="card3d-inner"
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
        >
          <div className="relative overflow-hidden aspect-square">
            <LazyImage
              src={product.images?.[0]}
              alt={product.name}
              wrapperClassName="card3d-pop w-full h-full"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
            />
            <div className="card3d-glare" />
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black via-black/35 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#FF6A00] via-[#FF9438] to-[#E04E00]" />

            {/* سهم المعاينة السريعة */}
            <span className="card3d-pop absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-white/90 dark:bg-black/70 text-black dark:text-[#FF9438] flex items-center justify-center opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-lg">
              <ArrowUpRight size={16} />
            </span>

            {product.tags?.includes('limited') && (
              <span className="absolute top-3 left-14 z-10 bg-[#0B0B0B] text-[#FF9438] border border-[#FF6A00]/50 text-[10px] tracking-[0.15em] uppercase px-3 py-1 rounded-md font-bold shadow">
                حصري
              </span>
            )}
            {product.tags?.includes('new') && !product.tags?.includes('limited') && (
              <span className="absolute top-3 left-14 z-10 bg-[#FF6A00] text-white text-[10px] tracking-[0.15em] uppercase px-3 py-1 rounded-md font-bold shadow">
                جديد
              </span>
            )}
            {product.tags?.includes('bestseller') && (
              <span className="absolute bottom-3 left-3 z-10 bg-white text-[#0B0B0B] text-[10px] tracking-[0.15em] uppercase px-3 py-1 rounded-md font-bold shadow">
                الأكثر مبيعاً
              </span>
            )}
          </div>

          <div className="card3d-pop px-4 pt-3.5 pb-4">
            <p className="text-[10px] tracking-[0.18em] uppercase text-[#FF6A00] mb-1">{product.product_type || 'PITSIKY'}</p>
            <h3 className="font-serif text-base md:text-lg text-[#141414] dark:text-[#F4F1E9] leading-tight line-clamp-1">{product.name}</h3>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm font-bold text-[#E04E00] dark:text-[#FF9438]">
                {variants.length ? 'من ' : ''}{formatMAD(minPrice)}
              </p>
              <span className="text-[11px] px-3 py-1 rounded-full bg-[#FF6A00]/10 border border-[#FF6A00]/40 text-[#E04E00] dark:text-[#FF9438] opacity-0 group-hover:opacity-100 transition-opacity">
                عرض اللوحة
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* ================= نافذة التعديل المنبثقة المحمية (Modal) ================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans" dir="rtl">
          {/* خلفية معتمة */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          
          {/* جسم النافذة */}
          <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-150 text-right">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">تعديل لوحة: {product.name}</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveChanges} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">اسم اللوحة / المنتج</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 text-sm bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#FF6A00]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">نوع المنتج</label>
                <input
                  type="text"
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                  className="w-full p-2.5 text-sm bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#FF6A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1">السعر الأساسي</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full p-2.5 text-sm bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-[#FF6A00]"
                  required
                />
              </div>

              {/* قسم الميديا الدقيق: يعرض للمسؤول تأكيداً مرئياً بأن رابط الميديا محمي ولن يتلف عند الحفظ */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800 rounded-lg flex items-center gap-3">
                <img src={product.images?.[0]} alt="Preview" className="w-12 h-12 rounded-md object-cover border border-gray-200 dark:border-zinc-800" />
                <div className="overflow-hidden flex-1">
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ImageIcon size={10} /> رابط الصورة من الـ Media محفوظ بدقة
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 truncate font-mono mt-0.5">{product.images?.[0]}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#FF6A00] to-[#E04E00] text-white py-2 px-4 rounded-lg font-medium text-sm hover:opacity-95 transition-opacity"
                >
                  حفظ التعديلات بدقة
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductCard;
