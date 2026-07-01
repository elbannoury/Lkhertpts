import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { formatMAD } from '@/data/catalog';
import LazyImage from '@/components/LazyImage';
import { ProductCardActions } from "@/components/products/product-card-actions";

interface Props {
  product: any;
}

const ProductCard: React.FC<Props> = ({ product }) => {
  const variants = product.variants || [];
  const minPrice = variants.length
    ? Math.min(...variants.map((v: any) => v.price))
    : product.price;

  const innerRef = useRef<HTMLDivElement>(null);

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

  // تهيئة بيانات منتجك لتتوافق بدقة مع حقول كود التعديل والحذف
  const adaptedProductForActions = {
    id: product.id || product._id || '',
    title: product.name || '',
    price: minPrice || 0,
    image_url: product.images?.[0] || '',
    description: product.description || '',
    media_id: product.media_id,
    is_from_media: product.is_from_media || !!product.media_id,
  };

  return (
    <Link to={`/products/${product.handle}`} className="group block card3d">
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
          
          {/* bottom gradient + orange accent line */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black via-black/35 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#FF6A00] via-[#FF9438] to-[#E04E00]" />

          {/* quick view chip */}
          <span className="card3d-pop absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-white/90 dark:bg-black/70 text-black dark:text-[#FF9438] flex items-center justify-center opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all shadow-lg">
            <ArrowUpRight size={16} />
          </span>

          {product.tags?.includes('limited') && (
            <span className="absolute top-3 left-3 z-10 bg-[#0B0B0B] text-[#FF9438] border border-[#FF6A00]/50 text-[10px] tracking-[0.15em] uppercase px-3 py-1 rounded-md font-bold shadow">
              حصري
            </span>
          )}
          {product.tags?.includes('new') && !product.tags?.includes('limited') && (
            <span className="absolute top-3 left-3 z-10 bg-[#FF6A00] text-white text-[10px] tracking-[0.15em] uppercase px-3 py-1 rounded-md font-bold shadow">
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
          {/* هنا تم دمج زر الإجراءات بشكل متناسق في الأعلى بجانب العنوان */}
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] tracking-[0.18em] uppercase text-[#FF6A00] mb-1">
                {product.product_type || 'PITSIKY'}
              </p>
              <h3 className="font-serif text-base md:text-lg text-[#141414] dark:text-[#F4F1E9] leading-tight line-clamp-1">
                {product.name}
              </h3>
            </div>
            
            {/* زر الخيارات (تعديل، حذف، تكرار) مع منع انتشار حدث الضغط لكي لا يفتح الرابط */}
            <div 
              className="relative z-30" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <ProductCardActions product={adaptedProductForActions} />
            </div>
          </div>

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
  );
};

export default ProductCard;
