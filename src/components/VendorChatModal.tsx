import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StorageManager } from '../data/mockStorage';
import { Vendor } from '../types';
import { ALL_IKORODU_AREAS } from '../data/ikoroduData';
import {
  MessageCircle,
  X,
  Send,
  ShieldCheck,
  MapPin,
  Phone,
  User,
  CheckCheck,
  MessageSquare,
} from 'lucide-react';

interface VendorChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor;
  initialProduct?: string;
}

export const VendorChatModal: React.FC<VendorChatModalProps> = ({
  isOpen,
  onClose,
  vendor,
  initialProduct,
}) => {
  const { currentUser, showToast, refreshData } = useApp();

  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [customerArea, setCustomerArea] = useState(currentUser?.area || ALL_IKORODU_AREAS[0]);
  const [messageText, setMessageText] = useState(
    initialProduct
      ? `Hello! I would like to inquire about "${initialProduct}". Is it available and can you deliver to my neighborhood?`
      : `Hello ${vendor.businessName}! I found your store on IkoroduSquare and would like to ask a quick question.`
  );

  const [chatLog, setChatLog] = useState<{ sender: 'vendor' | 'customer'; text: string; time: string }[]>([
    {
      sender: 'vendor',
      text: `Hello! Welcome to ${vendor.businessName}. We are located in ${vendor.area}, Ikorodu. How can we help you today?`,
      time: 'Just now',
    },
  ]);

  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || !messageText.trim()) {
      showToast('error', 'Incomplete Form', 'Please fill in your name, phone number, and message.');
      return;
    }

    setIsSending(true);

    const newEnquiry = {
      id: 'enq-' + Date.now(),
      vendorId: vendor.id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerArea,
      productName: initialProduct || undefined,
      message: messageText.trim(),
      createdAt: new Date().toISOString(),
      read: false,
      readStatus: false,
    };

    StorageManager.addEnquiry(newEnquiry);
    refreshData();

    // Update Chat UI Log
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatLog((prev) => [
      ...prev,
      { sender: 'customer', text: messageText.trim(), time: nowTime },
    ]);

    showToast('success', 'Message Sent!', `Your inquiry has been sent directly to ${vendor.businessName}.`);
    setMessageText('');
    setIsSending(false);

    // Auto simulated vendor acknowledgement reply after 1 sec
    setTimeout(() => {
      setChatLog((prev) => [
        ...prev,
        {
          sender: 'vendor',
          text: `Thank you ${customerName}! We have received your inquiry regarding ${initialProduct ? `"${initialProduct}"` : 'our store services'}. We will reach out to you directly on WhatsApp (${customerPhone}) shortly!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1200);
  };

  const handleWhatsAppRedirect = () => {
    const cleanPhone = vendor.whatsapp.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hi ${vendor.businessName}, I am ${customerName || 'a customer'} from IkoroduSquare. ${
        initialProduct
          ? `I'm inquiring about ${initialProduct}.`
          : 'I would like to inquire about your products and services.'
      }`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Chat Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={vendor.logoURL}
                alt={vendor.businessName}
                className="w-10 h-10 rounded-2xl object-cover border border-slate-700 bg-white"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm sm:text-base text-white">{vendor.businessName}</h3>
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-orange-400" /> {vendor.area}, Ikorodu • Online
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Body & History */}
        <div className="p-4 overflow-y-auto space-y-3 bg-slate-50 flex-1 min-h-[220px]">
          <div className="text-center my-1">
            <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Real-Time Vendor Chat • Ikorodu Square
            </span>
          </div>

          {chatLog.map((chat, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                chat.sender === 'customer' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                  chat.sender === 'customer'
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                }`}
              >
                <p>{chat.text}</p>
                <span
                  className={`text-[9px] mt-1 block text-right font-medium ${
                    chat.sender === 'customer' ? 'text-emerald-100' : 'text-slate-400'
                  }`}
                >
                  {chat.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Customer Contact & Input Form */}
        <div className="p-4 bg-white border-t border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-0.5">
                Your Name
              </label>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-0.5">
                Phone / WhatsApp Number
              </label>
              <input
                type="tel"
                required
                placeholder="08031234567"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Type your message to vendor..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <button
              type="submit"
              disabled={isSending}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>

          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
            <button
              type="button"
              onClick={handleWhatsAppRedirect}
              className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              Continue on WhatsApp instead
            </button>

            <span className="flex items-center gap-1 text-slate-400">
              <CheckCheck className="w-3.5 h-3.5 text-blue-500" /> Direct Delivery Inquiry
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
