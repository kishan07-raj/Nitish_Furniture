function ProductTags({ tags }) {
  const tagStyles = {
    "Best for compact homes": "bg-blue-100 text-blue-800",
    "Ideal for families with kids": "bg-green-100 text-green-800",
    "Suitable for rental homes": "bg-purple-100 text-purple-800",
    "Safe for stone or tiled floors": "bg-orange-100 text-orange-800",
    "Ideal for low-ceiling rooms": "bg-red-100 text-red-800"
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {tags?.map((tag, index) => (
        <span
          key={index}
          className={`px-2 py-1 text-xs font-medium rounded-full ${tagStyles[tag] || "bg-gray-100 text-gray-800"}`}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export default ProductTags;
