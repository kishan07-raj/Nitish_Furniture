import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const MOODS = [
  {
    id: "modern",
    label: "Modern",
    icon: "🎯",
    description: "Clean lines, minimal fuss",
    colors: "from-slate-500 to-slate-700",
    tags: ["contemporary", "minimalist", "sleek"]
  },
  {
    id: "luxury",
    label: "Luxury",
    icon: "👑",
    description: "Opulent & sophisticated",
    colors: "from-amber-500 to-yellow-700",
    tags: ["premium", "elegant", "royal"]
  },
  {
    id: "minimal",
    label: "Minimal",
    icon: "✨",
    description: "Less is more",
    colors: "from-slate-200 to-slate-400",
    tags: ["simple", "clean", "basic"]
  },
  {
    id: "royal",
    label: "Royal",
    icon: "🏰",
    description: "Classic grandeur",
    colors: "from-purple-600 to-purple-900",
    tags: ["traditional", "classic", "heritage"]
  },
  {
    id: "bohemian",
    label: "Bohemian",
    icon: "🌿",
    description: "Free-spirited & eclectic",
    colors: "from-green-500 to-teal-700",
    tags: ["natural", "artistic", "organic"]
  },
  {
    id: "industrial",
    label: "Industrial",
    icon: "⚙️",
    description: "Raw & edgy",
    colors: "from-neutral-500 to-neutral-700",
    tags: ["rustic", "urban", "vintage"]
  }
];

export default function MoodSelector({ onSelect, compact = false }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const navigate = useNavigate();

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    if (onSelect) {
      onSelect(mood);
    } else {
      // Navigate to stores with mood filter
      navigate(`/stores?mood=${mood.id}&style=${mood.tags.join(",")}`);
    }
  };

  if (compact) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {MOODS.slice(0, 4).map((mood) => (
          <button
            key={mood.id}
            onClick={() => handleMoodSelect(mood)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              selectedMood?.id === mood.id
                ? `bg-gradient-to-r ${mood.colors} text-white shadow-lg`
                : "bg-slate-100 dark:bg-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-600"
            }`}
          >
            <span className="mr-1">{mood.icon}</span>
            {mood.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-serif font-semibold text-neutral-900 dark:text-white mb-2">
          How do you want your space to feel?
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400">
          Select a mood and we'll curate matching furniture for you
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {MOODS.map((mood, index) => (
          <motion.button
            key={mood.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleMoodSelect(mood)}
            className={`group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:shadow-xl ${
              selectedMood?.id === mood.id
                ? "ring-2 ring-amber-500 ring-offset-2"
                : ""
            }`}
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${mood.colors} opacity-90 group-hover:opacity-100 transition-opacity`} />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="text-4xl mb-3">{mood.icon}</div>
              <h4 className="text-lg font-semibold text-white mb-1">
                {mood.label}
              </h4>
              <p className="text-white/80 text-sm">
                {mood.description}
              </p>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-1 mt-3">
                {mood.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-white/20 text-white rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
          </motion.button>
        ))}
      </div>

      {/* Selected Mood Info */}
      {selectedMood && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-6 text-center"
        >
          <p className="text-amber-700 dark:text-amber-400">
            Showing {selectedMood.label.toLowerCase()} furniture for you →
          </p>
        </motion.div>
      )}
    </div>
  );
}

// Mood-based product filtering helper
export function filterByMood(products, moodId) {
  if (!moodId) return products;
  
  const mood = MOODS.find(m => m.id === moodId);
  if (!mood) return products;
  
  return products.filter(product => {
    const productText = `${product.name} ${product.description} ${product.tags?.join(" ")}`.toLowerCase();
    return mood.tags.some(tag => productText.includes(tag));
  });
}

