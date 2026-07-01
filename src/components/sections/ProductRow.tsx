import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '@/components/ProductCard';

interface Props {
  eyebrow: string;
  title: string;
  products: any[];
  link?: string;
  // 1. قمنا بإضافة الدوال هنا في الـ Interface لكي يقبلها المكون كـ Props
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updatedData: any) => void;
  onDuplicate?: (product: any) => void;
}

const ProductRow: React.FC<Props> = ({ 
  eyebrow, 
  title, 
  products, 
  link,
  onDelete,     // 2. استدعاء الدوال هنا من الـ Props
  onUpdate,
  onDuplicate
}) => {
  if (!products?.length) return null;
  return (
    <section className="max-w-[1400px] mx-auto px-6 lg:px-10 py-20">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="text-xs tracking-[0.3em] uppercase text-[#C9A23F] mb-3">{eyebrow}</p>
          <h2 className="font-serif text-4xl md:text-5xl text-[#141414] dark:text-[#F4F1E9]">{title}</h2>
        </div>
        {link && (
          <Link to={link} className="hidden sm:block text-xs tracking-[0.2em] uppercase text-[#141414] dark:text-[#F4F1E9] border-b border-[#C9A23F] pb-1 hover:text-[#C9A23F]">
            View All
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
        {products.slice(0, 4).map((p) => (
          // 3. هنا المكان الدقيق للتمرير داخل الـ map لكي تأخذ كل بطاقة الأكشن الخاص بها
          <ProductCard 
            key={p.id || p._id} 
            product={p} 
            onDelete={onDelete}
            onUpdate={onUpdate}
            onDuplicate={onDuplicate}
          />
        ))}
      </div>
    </section>
  );
};

export default ProductRow;
