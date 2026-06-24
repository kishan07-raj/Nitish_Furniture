import { useState, useRef } from 'react';

const ImageGallery = ({ images, productName }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!isZoomed || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomPosition({ x, y });
  };

  const handleImageClick = () => {
    setIsZoomed(!isZoomed);
  };

  const fallbackImages = [
    `https://via.placeholder.com/600x400?text=${encodeURIComponent(productName)}`,
    `https://via.placeholder.com/600x400?text=${encodeURIComponent(productName)}+View+2`,
    `https://via.placeholder.com/600x400?text=${encodeURIComponent(productName)}+View+3`,
  ];

  const displayImages = images && images.length > 0 ? images : fallbackImages;

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 cursor-zoom-in group"
        onMouseMove={handleMouseMove}
        onClick={handleImageClick}
        ref={imageRef}
      >
        <img
          src={displayImages[selectedIndex]}
          alt={`${productName} - View ${selectedIndex + 1}`}
          className={`w-full h-full object-cover transition-all duration-300 ${
            isZoomed ? 'scale-150' : 'group-hover:scale-105'
          }`}
          style={
            isZoomed
              ? {
                  transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  scale: 1.5,
                }
              : {}
          }
        />

        {/* Zoom Indicator */}
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {isZoomed ? '🔍 Click to zoom out' : '🔍 Click to zoom in'}
        </div>

        {/* 360° Rotation Indicator */}
        {displayImages.length > 3 && (
          <div className="absolute bottom-4 left-4 bg-amber-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
            <span>🔄</span>
            360° View
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {displayImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {displayImages.map((image, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedIndex(index);
                setIsZoomed(false);
              }}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                selectedIndex === index
                  ? 'border-amber-600 shadow-lg scale-105'
                  : 'border-slate-300 hover:border-amber-400 hover:scale-102'
              }`}
            >
              <img
                src={image}
                alt={`${productName} thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Image Counter */}
      <div className="text-center text-sm text-slate-600">
        {selectedIndex + 1} of {displayImages.length} views
      </div>
    </div>
  );
};

export default ImageGallery;
