import { useState } from "react";

function VisualFilters({ onFilterChange }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({});

  const colorOptions = [
    { name: "Natural", color: "#D4A574" },
    { name: "Walnut", color: "#654321" },
    { name: "Honey", color: "#F5DEB3" },
    { name: "White", color: "#FFFFFF" }
  ];

  const fabricOptions = [
    { name: "Cotton", icon: "🧵" },
    { name: "Leather", icon: "🪑" },
    { name: "Velvet", icon: "✨" },
    { name: "Linen", icon: "🌿" }
  ];

  const styleOptions = [
    { name: "Minimal", icon: "⚪", image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop" },
    { name: "Classic", icon: "🏛️", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100&h=100&fit=crop" },
    { name: "Indian Traditional", icon: "🕉️", image: "https://images.unsplash.com/photo-1549497538-303791108f95?w=100&h=100&fit=crop" }
  ];

  const handleFilterChange = (type, value) => {
    const newFilters = { ...selectedFilters, [type]: value };
    setSelectedFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const clearFilters = () => {
    setSelectedFilters({});
    onFilterChange?.({});
  };

  const activeFiltersCount = Object.keys(selectedFilters).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-rose-100 rounded-lg flex items-center justify-center">
            <span className="text-amber-700 text-sm">🎨</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Visual Preferences</h3>
            <p className="text-sm text-slate-600">
              {activeFiltersCount > 0 ? `${activeFiltersCount} preference${activeFiltersCount > 1 ? 's' : ''} selected` : 'Choose your style preferences'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {activeFiltersCount > 0 && (
            <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full animate-pulse">
              {activeFiltersCount}
            </span>
          )}
          <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            <span className="text-slate-400 text-lg">⌄</span>
          </div>
        </div>
      </div>

      {/* Collapsible Content */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-6 pb-6 space-y-8">
          {/* Colors */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
              Wood Finishes
            </h4>
            <div className="flex gap-3 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color.name}
                  onClick={() => handleFilterChange("color", color.name)}
                  className={`w-14 h-14 rounded-xl border-3 transition-all duration-200 hover:scale-110 hover:shadow-lg ${
                    selectedFilters.color === color.name
                      ? "border-amber-600 shadow-lg ring-2 ring-amber-200"
                      : "border-slate-300 hover:border-amber-400"
                  }`}
                  style={{ backgroundColor: color.color }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Fabrics */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              Upholstery Materials
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {fabricOptions.map((fabric) => (
                <button
                  key={fabric.name}
                  onClick={() => handleFilterChange("fabric", fabric.name)}
                  className={`p-4 border-2 rounded-xl text-center hover:bg-slate-50 transition-all duration-200 hover:scale-105 hover:shadow-md ${
                    selectedFilters.fabric === fabric.name
                      ? "border-emerald-600 bg-emerald-50 shadow-lg"
                      : "border-slate-200 hover:border-emerald-300"
                  }`}
                >
                  <div className="text-3xl mb-2">{fabric.icon}</div>
                  <div className="text-sm font-medium text-slate-900">{fabric.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Styles */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Design Styles
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {styleOptions.map((style) => (
                <button
                  key={style.name}
                  onClick={() => handleFilterChange("style", style.name)}
                  className={`p-4 border-2 rounded-xl text-center hover:bg-slate-50 transition-all duration-200 hover:scale-105 hover:shadow-md overflow-hidden ${
                    selectedFilters.style === style.name
                      ? "border-blue-600 bg-blue-50 shadow-lg"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <img
                    src={style.image}
                    alt={style.name}
                    className="w-16 h-16 rounded-lg mx-auto mb-3 object-cover transition-transform duration-200 hover:scale-110"
                  />
                  <div className="text-sm font-medium text-slate-900">{style.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={clearFilters}
                className="w-full px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-xl font-medium hover:from-slate-200 hover:to-slate-300 transition-all duration-200 hover:shadow-md"
              >
                Clear All Preferences ({activeFiltersCount})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VisualFilters;
