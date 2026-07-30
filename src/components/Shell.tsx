import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import WelcomePopup from '@/components/WelcomePopup';
import HelpWidget from '@/components/HelpWidget';

const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-[#FBF8F2] text-[#141414] dark:bg-[#0C0C0C] dark:text-[#F4F1E9] font-sans transition-colors duration-300">
    <Header />
    <main>{children}</main>
    <Footer />
    <CartDrawer />
    <WelcomePopup />
    <HelpWidget />
  </div>
);

export default Shell;
