import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ShieldCheck, ShoppingBag, Store, Sparkles, MessageCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface FAQItem {
  question: string;
  answer: string;
  tag: 'shoppers' | 'vendors';
}

const FAQ_DATA: FAQItem[] = [
  {
    tag: 'shoppers',
    question: 'How do I buy products or order services from vendors on IkoroduSquare?',
    answer:
      'IkoroduSquare connects you directly with local business owners across all 32 areas of Ikorodu. When you find a product or store you like, click "Chat with Vendor" or "WhatsApp" to message the seller directly. There are no middleman markup fees, and you can negotiate prices or arrange instant local delivery or shop pickup.',
  },
  {
    tag: 'shoppers',
    question: 'Are the businesses on IkoroduSquare verified and safe?',
    answer:
      'Yes! Look for the "Verified Business" badge with the green shield on vendor cards and profile pages. Our Ikorodu field agents physically inspect shop locations and verify Government NIN credentials before approving verified badges, giving you peace of mind when shopping locally.',
  },
  {
    tag: 'vendors',
    question: 'How do I register my business or earn the "Verified" badge for my store?',
    answer:
      'Click "List Your Business" in the navigation bar or top header. Fill in your business details, select your Ikorodu area, enter your WhatsApp contact, and submit your NIN for instant verified status. Standard listing is 100% free with zero sales commission!',
  },
];

export const FAQSection: React.FC = () => {
  const { setCurrentPage, setShowSetupModal } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | 'shoppers' | 'vendors'>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFAQs =
    activeTab === 'all' ? FAQ_DATA : FAQ_DATA.filter((item) => item.tag === activeTab);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-black uppercase tracking-wider border border-orange-200">
          <HelpCircle className="w-4 h-4 text-orange-600" /> Frequently Asked Questions
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
          Everything You Need to Know About IkoroduSquare
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          Got questions about buying, selling, or verifying your local business in Ikorodu? We've got answers!
        </p>

        {/* Tab Filters */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => {
              setActiveTab('all');
              setOpenIndex(0);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Questions
          </button>
          <button
            onClick={() => {
              setActiveTab('shoppers');
              setOpenIndex(0);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeTab === 'shoppers'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" /> For Shoppers
          </button>
          <button
            onClick={() => {
              setActiveTab('vendors');
              setOpenIndex(0);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              activeTab === 'vendors'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Store className="w-3.5 h-3.5" /> For Business Owners
          </button>
        </div>
      </div>

      {/* Accordion List */}
      <div className="max-w-4xl mx-auto space-y-3">
        {filteredFAQs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`rounded-2xl border transition overflow-hidden ${
                isOpen ? 'bg-orange-50/30 border-orange-300 shadow-xs' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`p-2 rounded-xl text-xs font-bold shrink-0 ${
                      faq.tag === 'shoppers'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {faq.tag === 'shoppers' ? <ShoppingBag className="w-4 h-4" /> : <Store className="w-4 h-4" />}
                  </span>
                  <span className="font-extrabold text-sm sm:text-base text-slate-900">
                    {faq.question}
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-slate-500 transition-transform duration-300 shrink-0 ${
                    isOpen ? 'rotate-180 text-orange-600' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-700 leading-relaxed border-t border-slate-200/60 font-medium">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Call to Action Footer inside FAQ */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto text-xs">
        <div className="flex items-center gap-2 text-slate-600 font-medium text-center sm:text-left">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Still have questions or need store setup assistance in Ikorodu?</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSetupModal(true)}
            className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold transition flex items-center gap-1.5 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" /> Book Setup Agent
          </button>
          <button
            onClick={() => setCurrentPage('auth')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold transition flex items-center gap-1.5 shadow-xs"
          >
            <Store className="w-3.5 h-3.5 text-amber-400" /> Register Store Free
          </button>
        </div>
      </div>
    </section>
  );
};
