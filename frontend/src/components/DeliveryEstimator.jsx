import { useState } from 'react';

const DeliveryEstimator = ({ productId }) => {
  const [pincode, setPincode] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [error, setError] = useState('');

  const handleCheckDelivery = async () => {
    if (!pincode || pincode.length !== 6) {
      setError('Please enter a valid 6-digit pincode');
      return;
    }

    setIsChecking(true);
    setError('');

    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock delivery data based on pincode
      const mockData = {
        available: Math.random() > 0.2, // 80% chance of availability
        deliveryTime: pincode.startsWith('11') ? '2-3 days' : '5-7 days',
        codAvailable: Math.random() > 0.3,
        estimatedDate: new Date(Date.now() + (pincode.startsWith('11') ? 3 : 7) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      };

      setDeliveryInfo(mockData);
    } catch (err) {
      setError('Unable to check delivery. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handlePincodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPincode(value);
    if (error) setError('');
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <span className="text-blue-600 text-sm">🚚</span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Delivery & Availability</h3>
      </div>

      <div className="space-y-4">
        {/* Pincode Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Enter your pincode
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={pincode}
              onChange={handlePincodeChange}
              placeholder="110001"
              className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              maxLength={6}
            />
            <button
              onClick={handleCheckDelivery}
              disabled={isChecking || pincode.length !== 6}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg"
            >
              {isChecking ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Checking...
                </div>
              ) : (
                'Check'
              )}
            </button>
          </div>
          {error && (
            <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
              <span>⚠️</span> {error}
            </p>
          )}
        </div>

        {/* Delivery Info */}
        {deliveryInfo && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center gap-3">
              {deliveryInfo.available ? (
                <>
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                  <div>
                    <p className="font-medium text-green-800">In Stock</p>
                    <p className="text-sm text-slate-600">Ready for delivery</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-sm">✗</span>
                  </div>
                  <div>
                    <p className="font-medium text-red-800">Out of Stock</p>
                    <p className="text-sm text-slate-600">Expected restock in 2-3 weeks</p>
                  </div>
                </>
              )}
            </div>

            {deliveryInfo.available && (
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-slate-900">Estimated Delivery</span>
                  <span className="text-sm text-slate-600">{deliveryInfo.deliveryTime}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <span>📅</span>
                  <span>Expected by {deliveryInfo.estimatedDate}</span>
                </div>
                {deliveryInfo.codAvailable && (
                  <div className="flex items-center gap-2 text-sm text-green-700 mt-2">
                    <span>💵</span>
                    <span>Cash on Delivery available</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryEstimator;
