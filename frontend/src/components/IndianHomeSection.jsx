function IndianHomeSection() {
  const features = [
    {
      title: "Heat Resistance",
      description: "Designed for Indian climate with materials that withstand high temperatures",
      icon: "🌡️"
    },
    {
      title: "Dust-Friendly Finishes",
      description: "Easy-to-clean surfaces that handle India's dusty environment",
      icon: "💨"
    },
    {
      title: "Storage-Focused Designs",
      description: "Ample storage solutions perfect for smaller Indian homes",
      icon: "📦"
    },
    {
      title: "Suitable for Smaller Rooms",
      description: "Compact designs that maximize space in urban Indian homes",
      icon: "🏠"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Crafted for Indian Homes</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our furniture is specially designed keeping in mind the unique needs and preferences of Indian households
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default IndianHomeSection;
