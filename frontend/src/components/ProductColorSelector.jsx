import { useState } from "react";
import { motion } from "framer-motion";

const WOOD_FINISHES = [
  {
    id: "natural-sheesham",
    name: "Natural Sheesham",
    color: "#C4A35A",
    priceModifier: 1.0,
    description: "Rich golden brown with natural grain patterns"
  },
  {
    id: "walnut",
    name: "Dark Walnut",
    color: "#5D4037",
    priceModifier: 1.15,
    description: "Deep chocolate brown for elegant spaces"
  },
  {
    id: "honey-oak",
    name: "Honey Oak",
    color: "#D4A574",
    priceModifier: 1.05,
    description: "Warm honey tones with light grain"
  },
  {
    id: "teak",
    name: "Premium Teak",
    color: "#B8860B",
    priceModifier: 1.3,
    description: "Luxurious golden teak finish"
  },
  {
    id: "white-oak",
    name: "White Oak",
    color: "#E8DCC4",
    priceModifier: 1.1,
    description: "Light Scandinavian-inspired finish"
  },
  {
    id: "mahogany",
    name: "Mahogany",
    color: "#4A0E0E",
    priceModifier: 1.25,
    description: "Rich reddish-brown classic finish"
  },
  {
    id: "black-walnut",
    name: "Black Walnut",
    color: "#2D2D2D",
    priceModifier: 1.2,
    description: "Modern black finish for contemporary homes"
  },
  {
    id: "grey-wash",
    name: "Grey Wash",
    color: "#9E9E9E",
    priceModifier: 1.1,
    description: "Trendy grey wash for modern interiors"
  }
];

const FABRIC_COLORS = [
  {
    id: "ivory",
    name: "Ivory",
    color: "#FFFFF0",
    priceModifier: 1.0
  },
  {
    id: "charcoal",
    name: "Charcoal Grey",
    color: "#36454F",
    priceModifier: 1.0
  },
  {
    id: "navy",
    name: "Navy Blue",
    color: "#000080",
    priceModifier: 1.05
  },
  {
    id: "burgundy",
    name: "Burgundy",
    color: "#800020",
    priceModifier: 1.05
  },
  {
    id: "forest-green",
    name: "Forest Green",
    color: "#228B22",
    priceModifier: 1.05
  },
  {
    id: "mustard",
    name: "Mustard Yellow",
    color: "#FFDB58",
    priceModifier: 1.0
  },
  {
    id: "terracotta",
    name: "Terracotta",
    color: "#E2725B",
    priceModifier: 1.05
  },
  {
    id: "blush-pink",
    name: "Blush Pink",
    color: "#DE5D83",
    priceModifier: 1.1
  }
];

export default function ProductColorSelector({ 
  onChange, 
  initialWood = WOOD_FINISHES[0],
  initialFabric = FABRIC_COLORS[0],
  basePrice = 0
}) {
  const [selectedWood, setSelectedWood] = useState(initialWood);
  const [selectedFabric, setSelectedFabric] = useState(initialFabric);
  const [showWoodOptions, setShowWoodOptions] = useState(true);

  const handleWoodSelect = (wood) => {
    setSelectedWood(wood);
    onChange?.({ wood, fabric: selectedFabric });
  };

  const handleFabricSelect = (fabric) => {
    setSelectedFabric(fabric);
    onChange?.({ wood: selectedWood, fabric });
  };

  const calculatePrice = () => {
    if (!basePrice) return null;
    const total = basePrice * (selectedWood.priceModifier || 1) * (selectedFabric.priceModifier || 1);
    return Math.round(total);
  };

  const priceDiff = calculatePrice() ? calculatePrice() - basePrice : 0;

  return (
    <div className="space-y-6">
      {/* Wood Finish Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
              Wood Finish
            </h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {selectedWood.description}
            </p>
          </div>
          <button
            onClick={() => setShowWoodOptions(!showWoodOptions)}
            className="text-xs text-amber-600 hover:text-amber-700 font-medium"
          >
            {showWoodOptions ? "Show Less" : "Show All"}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {(showWoodOptions ? WOOD_FINISHES : WOOD_FINISHES.slice(0, 4)).map((wood) => (
            <button
              key={wood.id}
              onClick={() => handleWoodSelect(wood)}
              className={`group relative flex flex-col items-center p-2 rounded-xl border-2 transition-all duration-200 ${
                selectedWood.id === wood.id
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                  : "border-slate-200 dark:border-neutral-600 hover:border-amber-300"
              }`}
            >
              <div
                className="w-10 h-10 rounded-full shadow-inner border-2 border-white dark:border-neutral-700"
                style={{ backgroundColor: wood.color }}
              />
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mt-1 text-center line-clamp-1">
                {wood.name}
              </span>
              {wood.priceModifier > 1 && (
                <span className="absolute -top-1 -right-1 text-[10px] bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                  +{(wood.priceModifier - 1) * 100}%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Fabric Color Selection */}
      <div>
        <div className="mb-3">
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Fabric Color
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {selectedFabric.name} - Premium quality upholstery
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {FABRIC_COLORS.map((fabric) => (
            <button
              key={fabric.id}
              onClick={() => handleFabricSelect(fabric)}
              className={`group relative flex flex-col items-center p-2 rounded-xl border-2 transition-all duration-200 ${
                selectedFabric.id === fabric.id
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                  : "border-slate-200 dark:border-neutral-600 hover:border-amber-300"
              }`}
            >
              <div
                className="w-10 h-10 rounded-full shadow-inner border-2 border-white dark:border-neutral-700"
                style={{ backgroundColor: fabric.color }}
              />
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mt-1 text-center line-clamp-1">
                {fabric.name}
              </span>
              {fabric.priceModifier > 1 && (
                <span className="absolute -top-1 -right-1 text-[10px] bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                  +{(fabric.priceModifier - 1) * 100}%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Price Summary */}
      {priceDiff > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Customization Price
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500">
                {selectedWood.name} + {selectedFabric.name} upholstery
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-amber-700 dark:text-amber-400">
                +₹{priceDiff.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-neutral-500">
                Total: ₹{calculatePrice()?.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Selected Summary */}
      <div className="flex items-center gap-4 p-3 bg-slate50 dark:bg-neutral-700/30 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Wood:</span>
          <div
            className="w-6 h-6 rounded-full border border-slate-200"
            style={{ backgroundColor: selectedWood.color }}
          />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {selectedWood.name}
          </span>
        </div>
        <div className="w-px h-6 bg-slate-200 dark:bg-neutral-600" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Fabric:</span>
          <div
            className="w-6 h-6 rounded-full border border-slate-200"
            style={{ backgroundColor: selectedFabric.color }}
          />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {selectedFabric.name}
          </span>
        </div>
      </div>
    </div>
  );
}

