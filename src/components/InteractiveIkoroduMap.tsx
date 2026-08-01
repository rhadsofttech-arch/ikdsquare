import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Vendor } from '../types';
import { IKORODU_ZONES } from '../data/ikoroduData';
import { MapPin, Store, Star, ArrowRight, ShieldCheck, Navigation, Layers } from 'lucide-react';

interface AreaPinLocation {
  name: string;
  zone: string;
  x: number; // Percentage X on map canvas (0-100)
  y: number; // Percentage Y on map canvas (0-100)
}

// Major Ikorodu hubs mapped to visual canvas positions
const IKORODU_MAP_PINS: AreaPinLocation[] = [
  { name: 'Ikorodu Central', zone: 'Central', x: 48, y: 50 },
  { name: 'Ita Elewa', zone: 'Central', x: 52, y: 46 },
  { name: 'Town Centre', zone: 'Central', x: 50, y: 54 },
  { name: 'Owutu', zone: 'Central', x: 42, y: 48 },
  { name: 'Agric', zone: 'East', x: 38, y: 42 },
  { name: 'Sabo', zone: 'East', x: 45, y: 40 },
  { name: 'Odogunyan', zone: 'East', x: 58, y: 30 },
  { name: 'Benson', zone: 'East', x: 46, y: 58 },
  { name: 'Majidun', zone: 'East', x: 32, y: 55 },
  { name: 'Igbogbo', zone: 'North', x: 62, y: 52 },
  { name: 'Ota Ona', zone: 'North', x: 54, y: 38 },
  { name: 'Parafa', zone: 'North', x: 58, y: 36 },
  { name: 'Ibeshe', zone: 'North', x: 68, y: 60 },
  { name: 'Ebute', zone: 'South', x: 44, y: 72 },
  { name: 'Ipakodo', zone: 'South', x: 40, y: 68 },
  { name: 'Bayeku', zone: 'South', x: 60, y: 70 },
  { name: 'Ijede', zone: 'East', x: 78, y: 58 },
  { name: 'Imota', zone: 'South', x: 82, y: 28 },
  { name: 'Agbowa', zone: 'Hinterland', x: 88, y: 22 },
  { name: 'Ogijo', zone: 'Hinterland', x: 68, y: 20 },
  { name: 'Itaoluwo', zone: 'Hinterland', x: 64, y: 22 },
];

export const InteractiveIkoroduMap: React.FC = () => {
  const { vendors, selectedArea, setSelectedArea, navigateToStore } = useApp();
  const [activePin, setActivePin] = useState<AreaPinLocation | null>(
    IKORODU_MAP_PINS[0]
  );

  // Get active vendors for each area
  const getVendorsForArea = (areaName: string) => {
    return vendors.filter(
      (v) => v.status === 'approved' && v.isLive && v.area.toLowerCase() === areaName.toLowerCase()
    );
  };

  const currentAreaVendors = activePin ? getVendorsForArea(activePin.name) : [];

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl text-white">
      {/* Map Header */}
      <div className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-orange-500/20 text-orange-400">
              <Navigation className="w-5 h-5" />
            </span>
            <h3 className="font-extrabold text-lg sm:text-xl text-white">
              Interactive Ikorodu Market Map
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visual neighborhood breakdown • Tap any pin to discover verified local vendors across Ikorodu
          </p>
        </div>

        {/* Zone Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => {
              setSelectedArea('All');
              setActivePin(null);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
              selectedArea === 'All' && !activePin
                ? 'bg-orange-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            All 32 Areas
          </button>
          {IKORODU_ZONES.map((zone) => (
            <button
              key={zone.name}
              onClick={() => {
                const firstArea = zone.areas[0];
                setSelectedArea(firstArea);
                const pinMatch = IKORODU_MAP_PINS.find((p) => p.name === firstArea);
                setActivePin(pinMatch || IKORODU_MAP_PINS[0]);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                IKORODU_MAP_PINS.some((p) => p.name === selectedArea && p.zone === zone.name.split(' ')[0])
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {zone.name.replace(' zone', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Map Visual Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* SVG/Canvas Graphical Map Container */}
        <div className="lg:col-span-2 relative min-h-[380px] sm:min-h-[460px] bg-slate-950 p-4 flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          {/* Background Map Grid & Vector Art */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="map-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#f97316" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#map-grid)" />
              {/* Decorative Lagoon Water Curve for Ikorodu Waterfront */}
              <path
                d="M 0 300 Q 200 240, 400 320 T 800 380 L 800 500 L 0 500 Z"
                fill="#0284c7"
                opacity="0.3"
              />
            </svg>
          </div>

          {/* Map Compass & Legend Overlay */}
          <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 text-[11px] text-slate-300 space-y-1 z-10 hidden sm:block">
            <div className="flex items-center gap-1.5 text-orange-400 font-extrabold">
              <Layers className="w-3.5 h-3.5" /> Ikorodu Division
            </div>
            <p className="text-[10px] text-slate-400">🌊 South: Ikorodu Lagoon / Ebute Jetty</p>
            <p className="text-[10px] text-slate-400">🏙️ Central: Ita Elewa / Town Centre</p>
          </div>

          {/* Interactive Map Pins */}
          <div className="relative w-full h-full min-h-[360px] max-w-2xl mx-auto">
            {IKORODU_MAP_PINS.map((pin) => {
              const vendorCount = getVendorsForArea(pin.name).length;
              const isSelected = activePin?.name === pin.name;

              return (
                <div
                  key={pin.name}
                  onClick={() => {
                    setActivePin(pin);
                    setSelectedArea(pin.name);
                  }}
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 transition"
                >
                  {/* Pin Ripple effect when selected */}
                  {isSelected && (
                    <span className="absolute -inset-2 rounded-full bg-orange-500/30 animate-ping"></span>
                  )}

                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg border transition transform group-hover:scale-110 ${
                      isSelected
                        ? 'bg-orange-600 border-white text-white font-black z-30 scale-110 ring-2 ring-orange-400'
                        : vendorCount > 0
                        ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-600 text-slate-200 font-bold'
                        : 'bg-slate-900/80 border-slate-800 text-slate-500 text-[10px]'
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-orange-400'}`} />
                    <span className="text-xs whitespace-nowrap">{pin.name}</span>
                    {vendorCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isSelected ? 'bg-white text-orange-600' : 'bg-orange-500 text-white'
                      }`}>
                        {vendorCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Neighborhood Sidebar / Vendor Previews */}
        <div className="p-5 sm:p-6 bg-slate-900 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-extrabold text-orange-400 uppercase tracking-wider">
                  Selected Neighborhood
                </span>
                <h4 className="text-xl font-black text-white flex items-center gap-2 mt-0.5">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  {activePin ? activePin.name : 'Select a Location'}
                </h4>
              </div>

              <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full">
                {currentAreaVendors.length} Stores
              </span>
            </div>

            {/* List of Vendors in this Pin */}
            <div className="mt-4 space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {currentAreaVendors.length === 0 ? (
                <div className="p-6 text-center bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2">
                  <Store className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-300">No stores listed in {activePin?.name} yet</p>
                  <p className="text-[11px] text-slate-500">Are you a vendor in {activePin?.name}? List your shop today!</p>
                </div>
              ) : (
                currentAreaVendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    onClick={() => navigateToStore(vendor.slug)}
                    className="p-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl transition cursor-pointer flex items-center gap-3 group"
                  >
                    <img
                      src={vendor.logoURL}
                      alt={vendor.businessName}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-700 bg-slate-900"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h5 className="font-extrabold text-sm text-white group-hover:text-orange-400 transition truncate">
                          {vendor.businessName}
                        </h5>
                        {(vendor.ninVerified || vendor.nin_verified) && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{vendor.subCategory}</p>
                      <div className="flex items-center gap-2 text-[11px] text-amber-400 font-bold mt-0.5">
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400" /> {vendor.rating}
                        </span>
                        <span className="text-slate-600">•</span>
                        {(vendor.ninVerified || vendor.nin_verified) ? (
                          <span className="text-emerald-400 font-medium">Verified Vendor</span>
                        ) : (
                          <span className="text-slate-400 font-medium">Active Store</span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-1 transition shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => {
                if (activePin) {
                  setSelectedArea(activePin.name);
                  const el = document.getElementById('results-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="w-full bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-extrabold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition"
            >
              <span>Explore All {activePin?.name || 'Area'} Businesses</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
