import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check } from 'lucide-react';
import Shell from '@/components/Shell';

const OrderConfirmed: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <Shell>
      <div className="max-w-xl mx-auto px-6 py-32 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#6E44FF] flex items-center justify-center mb-8">
          <Check className="text-white" size={30} />
        </div>
        <h1 className="font-serif text-4xl mb-4">Order Received</h1>
        <p className="text-[#8D8D8D] leading-relaxed mb-2">
          Thank you. Your order <span className="text-[#1D1D1D] font-medium">#{id}</span> has been placed.
        </p>
        <p className="text-[#8D8D8D] mb-10">Our team will contact you shortly to confirm delivery. No payment is needed online.</p>
        <Link to="/" className="inline-block bg-[#1D1D1D] text-white px-8 py-4 text-xs tracking-[0.2em] uppercase hover:bg-[#6E44FF] transition-colors">
          Continue Exploring
        </Link>
      </div>
    </Shell>
  );
};

export default OrderConfirmed;
