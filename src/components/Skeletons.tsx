import React from 'react';

export const BusinessCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-pulse flex flex-col h-full">
      {/* Cover Image Skeleton */}
      <div className="h-44 bg-slate-200 w-full relative">
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-300" />
        <div className="absolute bottom-3 left-3 w-20 h-6 rounded-full bg-slate-300" />
      </div>

      {/* Content Skeleton */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="h-5 w-3/4 bg-slate-300 rounded-md" />
            <div className="h-5 w-12 bg-slate-200 rounded-full" />
          </div>

          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 bg-slate-200 rounded-full" />
            <div className="h-4 w-1/3 bg-slate-200 rounded-md" />
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="h-3.5 w-full bg-slate-200 rounded-md" />
            <div className="h-3.5 w-4/5 bg-slate-200 rounded-md" />
          </div>
        </div>

        {/* Footer Buttons Skeleton */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
          <div className="h-9 bg-slate-200 rounded-xl" />
          <div className="h-9 bg-slate-300 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export const BusinessGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <BusinessCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-pulse flex flex-col">
      <div className="h-48 bg-slate-200 w-full relative">
        <div className="absolute top-3 left-3 w-16 h-6 rounded-md bg-slate-300" />
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          <div className="h-4 w-3/4 bg-slate-300 rounded-md" />
          <div className="h-6 w-1/3 bg-slate-300 rounded-md" />
          <div className="h-3.5 w-full bg-slate-200 rounded-md" />
        </div>
        <div className="h-10 bg-slate-200 rounded-xl w-full" />
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const VendorProfileSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Cover Skeleton */}
      <div className="h-48 md:h-64 bg-slate-300 animate-pulse w-full relative" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-pulse space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-slate-300 border-4 border-white shadow-md -mt-12 flex-shrink-0" />
              <div className="space-y-2 pt-2">
                <div className="h-7 w-56 bg-slate-300 rounded-lg" />
                <div className="flex gap-2">
                  <div className="h-4 w-24 bg-slate-200 rounded-md" />
                  <div className="h-4 w-20 bg-slate-200 rounded-md" />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-11 w-36 bg-slate-300 rounded-xl" />
              <div className="h-11 w-32 bg-slate-200 rounded-xl" />
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-4">
            <div className="h-4 w-full bg-slate-200 rounded-md" />
            <div className="h-4 w-2/3 bg-slate-200 rounded-md" />
          </div>
        </div>

        {/* Tab Header Skeleton */}
        <div className="mt-8 flex gap-4 border-b border-slate-200 pb-3">
          <div className="h-8 w-28 bg-slate-300 rounded-lg animate-pulse" />
          <div className="h-8 w-24 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-8 w-24 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        {/* Products Grid Skeleton */}
        <div className="mt-6">
          <ProductGridSkeleton count={6} />
        </div>
      </div>
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-8">
      {/* Header Banner Skeleton */}
      <div className="h-32 bg-slate-200 rounded-3xl w-full" />

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="w-10 h-10 bg-slate-200 rounded-xl" />
            <div className="h-7 w-1/2 bg-slate-300 rounded-md" />
            <div className="h-4 w-3/4 bg-slate-200 rounded-md" />
          </div>
        ))}
      </div>

      {/* Content Block Skeleton */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="h-6 w-48 bg-slate-300 rounded-md" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-2xl w-full" />
          ))}
        </div>
      </div>
    </div>
  );
};

export const UserProfileSkeleton: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse space-y-6">
      <div className="h-40 bg-slate-200 rounded-3xl w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-64 bg-slate-200 rounded-2xl" />
        <div className="md:col-span-2 h-64 bg-slate-200 rounded-2xl" />
      </div>
    </div>
  );
};
