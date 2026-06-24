import { useState } from 'react';

const ProductReviews = ({ productId }) => {
  const [sortBy, setSortBy] = useState('newest');
  const [showPhotoReviews, setShowPhotoReviews] = useState(false);

  // Mock reviews data - replace with actual API data
  const reviews = [
    {
      id: 1,
      name: "Priya Sharma",
      rating: 5,
      date: "2024-01-15",
      title: "Absolutely stunning craftsmanship!",
      comment: "The attention to detail is incredible. The wood finish is exactly as shown and the comfort is outstanding. Highly recommend!",
      photos: [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop"
      ],
      verified: true
    },
    {
      id: 2,
      name: "Rajesh Kumar",
      rating: 5,
      date: "2024-01-10",
      title: "Perfect for our living room",
      comment: "Delivery was on time and the assembly was straightforward. The quality exceeds expectations for the price.",
      photos: [],
      verified: true
    },
    {
      id: 3,
      name: "Anita Patel",
      rating: 4,
      date: "2024-01-08",
      title: "Great value for money",
      comment: "Very comfortable and well-made. Only minor issue was with packaging but that was quickly resolved by customer service.",
      photos: [
        "https://images.unsplash.com/photo-1549497538-303791108f95?w=200&h=200&fit=crop"
      ],
      verified: true
    }
  ];

  const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
  const totalReviews = reviews.length;

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-amber-400' : 'text-slate-300'}`}>
        ★
      </span>
    ));
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.date) - new Date(a.date);
      case 'oldest':
        return new Date(a.date) - new Date(b.date);
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  const filteredReviews = showPhotoReviews
    ? sortedReviews.filter(review => review.photos.length > 0)
    : sortedReviews;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-purple-600 text-sm">⭐</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Customer Reviews</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center">
                {renderStars(Math.round(averageRating))}
              </div>
              <span className="text-sm text-slate-600">
                {averageRating.toFixed(1)} out of 5 ({totalReviews} reviews)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showPhotoReviews}
            onChange={(e) => setShowPhotoReviews(e.target.checked)}
            className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
          />
          <span className="text-sm text-slate-700">Reviews with photos only</span>
        </label>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.map((review) => (
          <div key={review.id} className="border-b border-slate-100 pb-6 last:border-b-0 last:pb-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-medium text-sm">
                    {review.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{review.name}</span>
                    {review.verified && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        ✓ Verified Purchase
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm text-slate-600">
                      {new Date(review.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="ml-13">
              <h4 className="font-medium text-slate-900 mb-2">{review.title}</h4>
              <p className="text-slate-700 mb-4 leading-relaxed">{review.comment}</p>

              {/* Review Photos */}
              {review.photos.length > 0 && (
                <div className="flex gap-3 overflow-x-auto">
                  {review.photos.map((photo, index) => (
                    <div key={index} className="flex-shrink-0">
                      <img
                        src={photo}
                        alt={`Review photo ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-slate-200 hover:border-purple-300 transition-colors duration-200 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {filteredReviews.length > 3 && (
        <div className="text-center mt-6">
          <button className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-all duration-200 hover:shadow-lg">
            Load More Reviews
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
