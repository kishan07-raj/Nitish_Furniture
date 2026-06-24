import React from 'react';

const ShimmerPlaceholder = ({ className = "" }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-slate-200 rounded-lg mb-4 aspect-[4/3]"></div>
      <div className="space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
        <div className="h-6 bg-slate-200 rounded w-1/4"></div>
        <div className="flex gap-2">
          <div className="h-8 bg-slate-200 rounded flex-1"></div>
          <div className="h-8 bg-slate-200 rounded flex-1"></div>
        </div>
      </div>
    </div>
  );
};

export default ShimmerPlaceholder;
