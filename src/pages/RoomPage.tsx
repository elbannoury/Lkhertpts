import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import Shell from '@/components/Shell';
import ProductCard from '@/components/ProductCard';

const RoomPage: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const room = decodeURIComponent(name || '');
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('ecom_products')
      .select('*, variants:ecom_product_variants(*)')
      .eq('status', 'active')
      .eq('metadata->>room', room)
      .then(({ data }) => setProducts(data || []));
  }, [room]);

  return (
    <Shell>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pt-16 pb-10 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-[#6E44FF] mb-3">Shop the Space</p>
        <h1 className="font-serif text-4xl md:text-6xl">{room}</h1>
      </div>
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 pb-24">
        {products.length === 0 ? (
          <p className="text-center text-[#8D8D8D] py-20">Curating pieces for this room.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </Shell>
  );
};

export default RoomPage;
