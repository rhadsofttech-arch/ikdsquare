import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Search, Heart, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    currentUser,
    favorites,
    t,
  } = useApp();

  const handleHomeClick = () => {
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchClick = () => {
    if (currentPage !== 'home') {
      setCurrentPage('home');
    }
    setTimeout(() => {
      const searchInput = document.getElementById('search-input') || document.getElementById('main-search');
      if (searchInput) {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        const resultsEl = document.getElementById('results-section') || document.getElementById('products-section');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, 100);
  };

  const handleWishlistClick = () => {
    if (currentUser) {
      setCurrentPage('profile');
      // Set hash or tab signal for favorites
      window.location.hash = 'favorites';
      window.dispatchEvent(new Event('hashchange'));
    } else {
      setCurrentPage('auth');
    }
  };

  const handleProfileClick = () => {
    if (currentUser) {
      setCurrentPage('profile');
    } else {
      setCurrentPage('auth');
    }
  };

  const isHomeActive = currentPage === 'home';
  const isWishlistActive = currentPage === 'profile' && window.location.hash === '#favorites';
  const isProfileActive = (currentPage === 'profile' || currentPage === 'user-profile' || currentPage === 'auth' || currentPage === 'dashboard') && !isWishlistActive;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg md:hidden">
      <div className="grid grid-cols-4 h-16 max-w-lg mx-auto">
        {/* Home */}
        <button
          type="button"
          onClick={handleHomeClick}
          className={`flex flex-col items-center justify-center py-1.5 px-2 transition-all relative ${
            isHomeActive ? 'text-orange-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {isHomeActive && (
            <span className="absolute top-0 w-8 h-1 bg-orange-600 rounded-b-full shadow-xs" />
          )}
          <Home className={`w-5 h-5 transition-transform ${isHomeActive ? 'scale-110' : ''}`} />
          <span className="text-[11px] mt-1 tracking-tight truncate max-w-full">
            {t('nav_home', 'Home')}
          </span>
        </button>

        {/* Search */}
        <button
          type="button"
          onClick={handleSearchClick}
          className="flex flex-col items-center justify-center py-1.5 px-2 transition-all relative text-slate-500 hover:text-slate-800"
        >
          <Search className="w-5 h-5" />
          <span className="text-[11px] mt-1 tracking-tight truncate max-w-full">
            {t('nav_search', 'Search')}
          </span>
        </button>

        {/* Wishlist */}
        <button
          type="button"
          onClick={handleWishlistClick}
          className={`flex flex-col items-center justify-center py-1.5 px-2 transition-all relative ${
            isWishlistActive ? 'text-orange-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {isWishlistActive && (
            <span className="absolute top-0 w-8 h-1 bg-orange-600 rounded-b-full shadow-xs" />
          )}
          <div className="relative">
            <Heart className={`w-5 h-5 transition-transform ${isWishlistActive ? 'scale-110 fill-orange-600 text-orange-600' : ''}`} />
            {favorites.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                {favorites.length > 9 ? '9+' : favorites.length}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-1 tracking-tight truncate max-w-full">
            {t('nav_wishlist', 'Wishlist')}
          </span>
        </button>

        {/* Profile */}
        <button
          type="button"
          onClick={handleProfileClick}
          className={`flex flex-col items-center justify-center py-1.5 px-2 transition-all relative ${
            isProfileActive ? 'text-orange-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {isProfileActive && (
            <span className="absolute top-0 w-8 h-1 bg-orange-600 rounded-b-full shadow-xs" />
          )}
          <User className={`w-5 h-5 transition-transform ${isProfileActive ? 'scale-110' : ''}`} />
          <span className="text-[11px] mt-1 tracking-tight truncate max-w-full">
            {currentUser ? t('nav_profile', 'Profile') : t('nav_login', 'Sign In')}
          </span>
        </button>
      </div>
    </nav>
  );
};
