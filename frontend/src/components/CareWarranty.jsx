import React from 'react';

const CareWarranty = ({ care, warranty }) => {
  return (
    <div className="space-y-4">
      {care && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Care Instructions</h3>
          <p className="text-sm text-gray-600">{care}</p>
        </div>
      )}
      {warranty && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Warranty</h3>
          <p className="text-sm text-gray-600">{warranty}</p>
        </div>
      )}
    </div>
  );
};

export default CareWarranty;
