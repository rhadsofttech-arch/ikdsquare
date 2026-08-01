import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StorageManager } from '../data/mockStorage';
import { UserProfileSkeleton } from '../components/Skeletons';
import { ALL_IKORODU_AREAS } from '../data/ikoroduData';
import { User, DeliveryAddress, Order, OrderStatus } from '../types';
import {
  User as UserIcon,
  MapPin,
  Package,
  Heart,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Edit3,
  Trash2,
  Phone,
  Mail,
  Building2,
  ExternalLink,
  MessageSquare,
  Clock,
  CreditCard,
  Search,
  Sparkles,
  Camera,
  Check,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Truck,
  X,
  Star
} from 'lucide-react';

export const UserProfilePage: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    setCurrentPage,
    navigateToStore,
    vendors,
    favorites,
    showToast,
    isLoading,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'favorites'>('profile');

  // Profile Form State
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileEmail, setProfileEmail] = useState(currentUser?.email || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileArea, setProfileArea] = useState(currentUser?.area || 'Agric');
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatarURL || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Address Management State
  const [addresses, setAddresses] = useState<DeliveryAddress[]>(() =>
    StorageManager.getUserAddresses(currentUser)
  );
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Address Form State
  const [addressTitle, setAddressTitle] = useState('Home');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressArea, setAddressArea] = useState('Agric');
  const [addressLandmark, setAddressLandmark] = useState('');
  const [addressPhone, setAddressPhone] = useState(currentUser?.phone || '');
  const [addressIsDefault, setAddressIsDefault] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<Order[]>(() =>
    StorageManager.getOrders(currentUser?.id)
  );
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  if (isLoading) {
    return <UserProfileSkeleton />;
  }

  // Favorite Vendors
  const favoriteVendors = vendors.filter((v) => favorites.includes(v.id));

  // Default avatars list for quick pick
  const AVATAR_PRESETS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  ];

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      showToast('error', 'Required Field', 'Please enter your full name.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updatedUser: User = {
        id: currentUser?.id || `user_${Date.now()}`,
        name: profileName.trim(),
        email: profileEmail.trim() || undefined,
        phone: profilePhone.trim(),
        role: currentUser?.role || 'customer',
        area: profileArea,
        avatarURL: profileAvatar,
        phoneVerified: true,
        savedAddresses: addresses,
        vendorId: currentUser?.vendorId,
        createdAt: currentUser?.createdAt || new Date().toISOString(),
      };

      await StorageManager.setCurrentUserAsync(updatedUser);
      setCurrentUser(updatedUser);
      showToast('success', 'Profile Updated!', 'Your personal information has been saved.');
    } catch (err) {
      console.error(err);
      showToast('error', 'Update Failed', 'Failed to update profile settings.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Open Address Modal for New/Edit
  const handleOpenAddressModal = (addr?: DeliveryAddress) => {
    if (addr) {
      setEditingAddressId(addr.id);
      setAddressTitle(addr.title);
      setAddressStreet(addr.streetAddress);
      setAddressArea(addr.area);
      setAddressLandmark(addr.landmark || '');
      setAddressPhone(addr.phone);
      setAddressIsDefault(addr.isDefault || false);
    } else {
      setEditingAddressId(null);
      setAddressTitle('Home');
      setAddressStreet('');
      setAddressArea(currentUser?.area || 'Agric');
      setAddressLandmark('');
      setAddressPhone(currentUser?.phone || '');
      setAddressIsDefault(addresses.length === 0);
    }
    setIsAddressModalOpen(true);
  };

  // Save Address Handler
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressStreet.trim() || !addressPhone.trim()) {
      showToast('error', 'Missing Details', 'Please fill in street address and contact phone number.');
      return;
    }

    let updatedList: DeliveryAddress[];

    if (editingAddressId) {
      updatedList = addresses.map((a) => {
        if (a.id === editingAddressId) {
          return {
            ...a,
            title: addressTitle,
            streetAddress: addressStreet.trim(),
            area: addressArea,
            landmark: addressLandmark.trim(),
            phone: addressPhone.trim(),
            isDefault: addressIsDefault,
          };
        }
        return addressIsDefault ? { ...a, isDefault: false } : a;
      });
    } else {
      const newAddr: DeliveryAddress = {
        id: `addr_${Date.now()}`,
        title: addressTitle,
        streetAddress: addressStreet.trim(),
        area: addressArea,
        landmark: addressLandmark.trim(),
        phone: addressPhone.trim(),
        isDefault: addressIsDefault || addresses.length === 0,
      };

      if (addressIsDefault) {
        updatedList = addresses.map((a) => ({ ...a, isDefault: false }));
        updatedList.unshift(newAddr);
      } else {
        updatedList = [...addresses, newAddr];
      }
    }

    setAddresses(updatedList);
    setIsAddressModalOpen(false);

    if (currentUser) {
      await StorageManager.saveUserAddressesAsync(currentUser, updatedList);
    }
    showToast('success', 'Address Saved', 'Your delivery address has been saved.');
  };

  // Delete Address
  const handleDeleteAddress = async (id: string) => {
    const filtered = addresses.filter((a) => a.id !== id);
    setAddresses(filtered);
    if (currentUser) {
      await StorageManager.saveUserAddressesAsync(currentUser, filtered);
    }
    showToast('info', 'Address Removed', 'The delivery address was deleted.');
  };

  // Set Address as Default
  const handleSetDefaultAddress = async (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    setAddresses(updated);
    if (currentUser) {
      await StorageManager.saveUserAddressesAsync(currentUser, updated);
    }
    showToast('success', 'Default Updated', 'Set as default delivery address for Ikorodu orders.');
  };

  // Format Status Badge
  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'dispatched':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 border border-emerald-200">
            <Truck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Out for Delivery</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 border border-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Delivered</span>
          </span>
        );
      case 'processing':
        return (
          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Vendor Preparing</span>
          </span>
        );
      default:
        return (
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Order Placed</span>
          </span>
        );
    }
  };

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Profile Header Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 -translate-y-6">
            <Building2 className="w-96 h-96 text-white" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-emerald-700 border-4 border-emerald-400/40 shadow-inner flex items-center justify-center shrink-0">
                {profileAvatar ? (
                  <img src={profileAvatar} alt={profileName} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-12 h-12 text-emerald-200" />
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="absolute -bottom-2 -right-2 bg-emerald-500 hover:bg-emerald-400 text-white p-2 rounded-xl shadow-md border-2 border-slate-900 transition"
                title="Change Avatar"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {currentUser?.name || 'Ikorodu Shopper'}
                </h1>
                <span className="bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {currentUser?.role === 'vendor' ? 'Vendor Owner' : 'Verified Shopper'}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs sm:text-sm text-emerald-100/90 font-medium pt-1">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  {currentUser?.phone || 'No phone added'}
                </span>
                {currentUser?.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-emerald-400" />
                    {currentUser.email}
                  </span>
                )}
                <span className="flex items-center gap-1.5 bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/10">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  {currentUser?.area || 'Agric'}, Ikorodu
                </span>
              </div>

              {/* Quick Stat Bar */}
              <div className="pt-4 grid grid-cols-3 gap-3 max-w-md">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 text-center border border-white/10">
                  <span className="block text-xl font-black text-white">{orders.length}</span>
                  <span className="text-[11px] text-emerald-200 font-medium">Orders Made</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 text-center border border-white/10">
                  <span className="block text-xl font-black text-white">{addresses.length}</span>
                  <span className="text-[11px] text-emerald-200 font-medium">Saved Addresses</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 text-center border border-white/10">
                  <span className="block text-xl font-black text-white">{favorites.length}</span>
                  <span className="text-[11px] text-emerald-200 font-medium">Saved Stores</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-200 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Personal Info</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Orders & Enquiries ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('addresses')}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'addresses'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Saved Addresses ({addresses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'favorites'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Favorite Stores ({favorites.length})</span>
          </button>
        </div>

        {/* TAB 1: PERSONAL INFORMATION */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-emerald-600" />
                <span>Personal Information Settings</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Manage your name, WhatsApp phone number, and preferred neighborhood for fast Ikorodu local deliveries.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl">
              
              {/* Quick Preset Avatar Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Choose Profile Picture
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  {AVATAR_PRESETS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setProfileAvatar(url)}
                      className={`w-14 h-14 rounded-2xl overflow-hidden border-2 transition ${
                        profileAvatar === url
                          ? 'border-emerald-600 scale-105 shadow-md'
                          : 'border-slate-200 hover:border-emerald-400'
                      }`}
                    >
                      <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="url"
                      placeholder="Or paste custom image URL..."
                      value={profileAvatar}
                      onChange={(e) => setProfileAvatar(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800 text-sm outline-none"
                    placeholder="e.g. Babatunde Adeleke"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800 text-sm outline-none"
                    placeholder="e.g. babatunde@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    WhatsApp Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full p-3 pr-24 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800 text-sm outline-none"
                      placeholder="e.g. 08023456789"
                      required
                    />
                    <span className="absolute right-2 top-2 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Primary Ikorodu Area / District
                  </label>
                  <select
                    value={profileArea}
                    onChange={(e) => setProfileArea(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800 text-sm outline-none bg-white"
                  >
                    {ALL_IKORODU_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}, Ikorodu
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Account Security & Permissions
                </span>
                <p className="text-xs text-slate-500">
                  Your profile is protected with Supabase Authentication and email verification. Store orders and customer messages sent to vendors are routed directly via WhatsApp.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  {isSavingProfile ? (
                    'Saving Changes...'
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Personal Info</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: ORDER HISTORY & STORE ENQUIRIES */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" />
                  <span>Your Orders & Store Enquiries</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Track deliveries, reorder items, or contact local Ikorodu vendors on WhatsApp.
                </p>
              </div>

              {/* Order Filter Pills */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-bold overflow-x-auto max-w-full">
                {['all', 'dispatched', 'processing', 'delivered'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOrderFilter(st)}
                    className={`px-3 py-1.5 rounded-lg capitalize whitespace-nowrap transition ${
                      orderFilter === st
                        ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-8 space-y-3">
                <Package className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-700">No Orders Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You haven't placed any orders with local Ikorodu vendors yet. Browse businesses on the homepage to start shopping!
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentPage('home')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition shadow-xs inline-flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" /> Explore Ikorodu Vendors
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 transition bg-white shadow-2xs hover:shadow-md space-y-4"
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900 text-sm">{order.orderNumber}</span>
                          {renderStatusBadge(order.status)}
                        </div>
                        <p className="text-xs text-slate-500">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="block text-xs text-slate-500 font-medium">Order Total</span>
                        <span className="text-lg font-black text-emerald-700">
                          ₦{order.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Content Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* Vendor Info */}
                      <div className="space-y-1">
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                          Vendor & Location
                        </span>
                        <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-emerald-600" />
                          {order.vendorName}
                        </p>
                        <p className="text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          {order.vendorArea}, Ikorodu
                        </p>
                      </div>

                      {/* Items Ordered */}
                      <div className="space-y-1">
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                          Items Purchased ({order.items.length})
                        </span>
                        <ul className="space-y-1">
                          {order.items.map((item) => (
                            <li key={item.id} className="text-slate-700 font-medium flex items-center justify-between">
                              <span>• {item.name} x{item.quantity}</span>
                              <span className="font-bold">₦{(item.price * item.quantity).toLocaleString()}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Delivery Address */}
                      <div className="space-y-1">
                        <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                          Delivery Destination
                        </span>
                        <p className="font-bold text-slate-800">{order.deliveryAddress.title}</p>
                        <p className="text-slate-600">{order.deliveryAddress.streetAddress}, {order.deliveryAddress.area}</p>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => navigateToStore(order.vendorSlug)}
                        className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                      >
                        <span>Visit {order.vendorName} Store</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/${order.vendorWhatsapp}?text=Hello%20${encodeURIComponent(order.vendorName)},%20I%20am%20enquiring%20about%20my%20IkoroduSquare%20Order%20${order.orderNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat Vendor on WhatsApp</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 px-3.5 rounded-xl transition"
                        >
                          Order Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SAVED DELIVERY ADDRESSES */}
        {activeTab === 'addresses' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <span>Saved Delivery Addresses in Ikorodu</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Manage your home, shop, or office addresses for seamless delivery checkout.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenAddressModal()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add New Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-8 space-y-3">
                <MapPin className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-700">No Delivery Address Saved</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Add your primary Ikorodu address (street, bus stop landmark, district) to speed up orders from local sellers.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenAddressModal()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition shadow-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Delivery Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-5 rounded-2xl border transition relative flex flex-col justify-between space-y-4 ${
                      addr.isDefault
                        ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-600" />
                          {addr.title}
                        </span>
                        {addr.isDefault && (
                          <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Default Address
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-slate-800 leading-snug">
                        {addr.streetAddress}
                      </p>

                      <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                        {addr.area}, Ikorodu
                      </p>

                      {addr.landmark && (
                        <p className="text-xs text-slate-500 bg-slate-100 p-2 rounded-lg font-medium">
                          <span className="font-bold text-slate-700">Landmark:</span> {addr.landmark}
                        </p>
                      )}

                      <p className="text-xs text-slate-600 flex items-center gap-1 font-medium pt-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {addr.phone}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline"
                        >
                          Set as Default
                        </button>
                      )}

                      <div className="flex items-center gap-2 ml-auto">
                        <button
                          type="button"
                          onClick={() => handleOpenAddressModal(addr)}
                          className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Address"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Address"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: FAVORITE STORES */}
        {activeTab === 'favorites' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <span>Saved Favorite Vendors</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Your bookmarked local businesses in Ikorodu.
              </p>
            </div>

            {favoriteVendors.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-8 space-y-3">
                <Heart className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-700">No Favorites Saved Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click the heart icon on any vendor store page to add them to your quick access list.
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentPage('home')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition shadow-xs inline-flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" /> Explore Vendors
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favoriteVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    onClick={() => navigateToStore(vendor.slug)}
                    className="border border-slate-200 hover:border-emerald-400 rounded-2xl p-4 transition bg-white shadow-2xs hover:shadow-md cursor-pointer space-y-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={vendor.logoURL}
                        alt={vendor.businessName}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-slate-900 text-sm truncate group-hover:text-emerald-700 transition">
                          {vendor.businessName}
                        </h4>
                        <p className="text-xs text-slate-500 truncate">{vendor.category} • {vendor.area}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1 text-amber-600 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {vendor.rating}
                      </span>
                      <span className="text-emerald-700 font-extrabold group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                        Visit Store <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODAL: ADD / EDIT DELIVERY ADDRESS */}
        {isAddressModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-scale-up">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <span>{editingAddressId ? 'Edit Delivery Address' : 'Add New Ikorodu Address'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Address Label / Title
                  </label>
                  <div className="flex items-center gap-2">
                    {['Home', 'Office', 'Shop', 'Family'].map((title) => (
                      <button
                        key={title}
                        type="button"
                        onClick={() => setAddressTitle(title)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition ${
                          addressTitle === title
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {title}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Street Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressStreet}
                    onChange={(e) => setAddressStreet(e.target.value)}
                    placeholder="e.g. 14 Hospital Road, off Agric Bus Stop"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-slate-800 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Ikorodu District / Area
                    </label>
                    <select
                      value={addressArea}
                      onChange={(e) => setAddressArea(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-slate-800 outline-none bg-white"
                    >
                      {ALL_IKORODU_AREAS.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Rider Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={addressPhone}
                      onChange={(e) => setAddressPhone(e.target.value)}
                      placeholder="e.g. 08023456789"
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-slate-800 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Landmark / Delivery Note
                  </label>
                  <input
                    type="text"
                    value={addressLandmark}
                    onChange={(e) => setAddressLandmark(e.target.value)}
                    placeholder="e.g. Opposite First Bank, yellow gate"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-slate-800 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={addressIsDefault}
                    onChange={(e) => setAddressIsDefault(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <label htmlFor="isDefault" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Set as default delivery address for Ikorodu checkout
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-md transition"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: ORDER DETAILS */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 animate-scale-up">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900 font-mono">
                    {selectedOrder.orderNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* Status */}
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700">Order Status:</span>
                  {renderStatusBadge(selectedOrder.status)}
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                    Itemized Order Breakdown
                  </span>
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200">
                    {selectedOrder.items.map((it) => (
                      <div key={it.id} className="flex justify-between items-center font-semibold text-slate-800">
                        <span>{it.name} x{it.quantity}</span>
                        <span className="font-bold">₦{(it.price * it.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center text-sm font-black text-emerald-800">
                      <span>Total Amount Paid</span>
                      <span>₦{selectedOrder.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700 block">Delivery Address:</span>
                  <p className="font-extrabold text-slate-900">{selectedOrder.deliveryAddress.title}</p>
                  <p className="text-slate-600">{selectedOrder.deliveryAddress.streetAddress}, {selectedOrder.deliveryAddress.area}</p>
                  {selectedOrder.deliveryAddress.landmark && (
                    <p className="text-slate-500 text-[11px]">Landmark: {selectedOrder.deliveryAddress.landmark}</p>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-md transition"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
