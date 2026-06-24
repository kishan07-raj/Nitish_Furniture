function AdminInsights() {
  const insights = [
    { label: "Top viewed category this week", value: "Sofas", trend: "+12%" },
    { label: "Most added to cart product", value: "Sheesham King Bed", trend: "+8%" },
    { label: "Conversion rate", value: "3.2%", trend: "+0.5%" },
    { label: "Average order value", value: "₹45,000", trend: "+5%" }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Quick Insights</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {insights.map((insight, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">{insight.label}</div>
            <div className="text-xl font-semibold text-gray-900 mb-1">{insight.value}</div>
            <div className="text-sm text-green-600">{insight.trend}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminInsights;
