import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { useI18n } from '@/contexts/I18nContext';

interface Props {
  products: any[];
}

const SomePaintings: React.FC<Props> = ({ products }) => {
  const { lang } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  if (!products?.length) return null;

  const list = products.slice(0, 12);
  const scroll = (dir: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: 'smooth' });
  };

  return (
    <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-xs tracking-[0.3em] uppercase text-[#C9A23F] mb-3">PITSIKY · CANVAS</p>
          <h2 className="font-serif text-4xl md:text-5xl text-[#141414] dark:text-[#F4F1E9]">
            {lang === 'ar' ? 'بعض اللوحات' : 'Some Paintings'}
          </h2>
        </div>
        <div className="hidden sm:flex gap-2">
          <button onClick={() => scroll(-1)} aria-label="Previous" className="h-11 w-11 rounded-full border border-[#FF6A00]/40 flex items-center justify-center text-[#E04E00] dark:text-[#FF9438] hover:bg-[#FF6A00] hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => scroll(1)} aria-label="Next" className="h-11 w-11 rounded-full border border-[#FF6A00]/40 flex items-center justify-center text-[#E04E00] dark:text-[#FF9438] hover:bg-[#FF6A00] hover:text-white transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-4 -mx-1 px-1 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none]"
        style={{ scrollbarWidth: 'none' }}
      >
        <style>{`section .snap-x::-webkit-scrollbar{display:none}`}</style>
        {list.map((p) => (
          <div key={p.id} className="snap-start shrink-0 w-[72%] sm:w-[44%] md:w-[30%] lg:w-[23%]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <Link to="/shop" className="inline-block btn-pk px-12 py-4 text-xs uppercase">
          {lang === 'ar' ? 'عرض كل المنتجات' : 'View all products'}
        </Link>
      </div>
    </section>
  );
};

export default SomePaintings;
