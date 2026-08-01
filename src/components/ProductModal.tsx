import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { StorageManager } from '../data/mockStorage';
import { ALL_SUBCATEGORIES } from '../data/ikoroduData';
import { X, Package, Upload, Image as ImageIcon } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, productToEdit }) => {
  const { activeVendor, refreshData, showToast } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(ALL_SUBCATEGORIES[0]);
  const [photoURL, setPhotoURL] = useState('');
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setDescription(productToEdit.description);
      setPrice(productToEdit.price.toString());
      setCategory(productToEdit.category);
      setPhotoURL(productToEdit.photoURL);
      setAvailable(productToEdit.available);
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setCategory(activeVendor?.subCategory || ALL_SUBCATEGORIES[0]);
      setPhotoURL('https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80');
      setAvailable(true);
    }
  }, [productToEdit, activeVendor]);

  if (!isOpen || !activeVendor) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      showToast('error', 'Missing Information', 'Please provide a product title and price.');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast('error', 'Invalid Price', 'Price must be a positive number in Naira.');
      return;
    }

    if (productToEdit) {
      const updated: Product = {
        ...productToEdit,
        name,
        description,
        price: priceNum,
        category,
        photoURL: photoURL || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
        available,
      };
      StorageManager.updateProduct(updated);
      showToast('success', 'Product Updated', `"${name}" has been updated.`);
    } else {
      const newProd: Product = {
        id: 'p-' + Date.now(),
        vendorId: activeVendor.id,
        vendorName: activeVendor.businessName,
        vendorSlug: activeVendor.slug,
        vendorArea: activeVendor.area,
        name,
        description,
        price: priceNum,
        category,
        photoURL: photoURL || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
        available,
        createdAt: new Date().toISOString(),
      };
      StorageManager.addProduct(newProd);
      showToast('success', 'Product Listed!', `"${name}" is now visible on your store catalogue.`);
    }

    refreshData();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-lg">{productToEdit ? 'Edit Product' : 'Add New Product'}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Product Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Custom Senator Outfit / iPhone 13 OLED Screen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Price in Naira (₦) *</label>
              <input
                type="number"
                required
                placeholder="e.g. 15000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none font-semibold text-orange-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white"
              >
                {ALL_SUBCATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Product Photo URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste image link or leave default"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500 outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  setPhotoURL(
                    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'
                  )
                }
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 border border-slate-300 flex items-center gap-1"
              >
                <ImageIcon className="w-3.5 h-3.5" /> Sample
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Product Description</label>
            <textarea
              rows={3}
              placeholder="Describe quality, sizes, colors, or warranty..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            ></textarea>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="availableCheck"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
            />
            <label htmlFor="availableCheck" className="text-xs font-bold text-slate-800">
              In Stock & Ready for Customer Orders
            </label>
          </div>

          <button
            type="submit"
            className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl shadow-sm transition text-sm"
          >
            {productToEdit ? 'Save Changes' : 'Publish Product to Store'}
          </button>
        </form>
      </div>
    </div>
  );
};
