import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StorageManager } from '../data/mockStorage';
import { ALL_IKORODU_AREAS } from '../data/ikoroduData';
import { Star, X, MessageSquareQuote, User, MapPin } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string;
  vendorName: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  vendorId,
  vendorName,
}) => {
  const { currentUser, refreshData, showToast } = useApp();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [guestName, setGuestName] = useState('');
  const [guestArea, setGuestArea] = useState(ALL_IKORODU_AREAS[0] || 'Ikorodu Central');
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const reviewerName = currentUser ? currentUser.name : guestName.trim();
    const reviewerArea = currentUser ? (currentUser.area || 'Ikorodu Resident') : guestArea;

    if (!reviewerName) {
      showToast('error', 'Name Required', 'Please provide your name to submit a review.');
      return;
    }

    if (!comment.trim()) {
      showToast('error', 'Review Empty', 'Please write a brief comment describing your experience.');
      return;
    }

    StorageManager.addReview({
      id: 'rev-' + Date.now(),
      vendorId,
      userName: reviewerName,
      userArea: reviewerArea,
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
      verifiedPurchase: true,
    });

    refreshData();
    showToast('success', 'Review Published!', 'Thank you for supporting local Ikorodu businesses.');
    setComment('');
    setGuestName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">Write a Review for {vendorName}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Star Rating selector */}
          <div className="text-center py-1">
            <p className="text-xs font-bold text-slate-600 mb-2">Tap stars to rate your experience:</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-emerald-700 mt-1">
              {rating === 5 && 'Outstanding ⭐⭐⭐⭐⭐'}
              {rating === 4 && 'Very Good ⭐⭐⭐⭐'}
              {rating === 3 && 'Good Experience ⭐⭐⭐'}
              {rating === 2 && 'Fair ⭐⭐'}
              {rating === 1 && 'Needs Improvement ⭐'}
            </p>
          </div>

          {!currentUser && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" /> Your Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mrs. Adebayo"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> Neighborhood Area
                </label>
                <select
                  value={guestArea}
                  onChange={(e) => setGuestArea(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {ALL_IKORODU_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Your Written Review *</label>
            <textarea
              rows={4}
              required
              placeholder="How was the product quality, response time, or service in Ikorodu?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl shadow-md transition text-sm flex items-center justify-center gap-2"
          >
            Publish Review
          </button>
        </form>
      </div>
    </div>
  );
};
