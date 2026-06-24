import { useState } from "react";

function BuyingGuide({ category }) {
  const [expandedGuide, setExpandedGuide] = useState(null);

  const guides = {
    sofas: {
      title: "Sofa Buying Guide",
      content: [
        "Measure your space: Account for 18-24 inches clearance behind and around the sofa",
        "Choose fabric wisely: Cotton for durability, velvet for luxury, leather for easy cleaning",
        "Test comfort: Sit and feel the cushions - they should bounce back quickly",
        "Consider storage: Look for sofas with built-in storage for small spaces"
      ]
    },
    dining: {
      title: "Dining Set Buying Guide",
      content: [
        "Measure your dining area: Allow 36 inches per person for comfortable seating",
        "Choose durable materials: Solid wood tables last longer than veneered ones",
        "Consider chair comfort: Test seat height and back support",
        "Think about storage: Look for tables with built-in storage or extendable designs"
      ]
    },
    mattresses: {
      title: "Mattress Buying Guide",
      content: [
        "Know your sleep position: Side sleepers need softer mattresses, back sleepers firmer",
        "Test for 15 minutes: Lie down in your preferred position to check comfort",
        "Consider size: Queen is most popular, king for couples who move a lot",
        "Check warranty: Good mattresses come with 10+ year warranties"
      ]
    },
    kids: {
      title: "Kids Furniture Buying Guide",
      content: [
        "Safety first: Rounded edges and stable designs prevent accidents",
        "Choose durable materials: Easy-to-clean surfaces and scratch-resistant finishes",
        "Consider growth: Adjustable or convertible furniture saves money long-term",
        "Storage solutions: Built-in storage helps keep rooms organized"
      ]
    }
  };

  const guide = guides[category];

  if (!guide) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-blue-600">📖</span>
          <span className="text-sm text-blue-800">
            Not sure which {category.slice(0, -1)} to choose? View the {guide.title} (2-minute read)
          </span>
        </div>
        <button
          onClick={() => setExpandedGuide(expandedGuide === category ? null : category)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          {expandedGuide === category ? "Hide Guide" : "View Guide"}
        </button>
      </div>

      {expandedGuide === category && (
        <div className="mt-4 space-y-2">
          {guide.content.map((tip, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span className="text-sm text-blue-700">{tip}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BuyingGuide;
