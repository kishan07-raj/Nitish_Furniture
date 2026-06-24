const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Voice Commerce Search - Natural Language Processing
// Handles queries like:
// - "modern sofa under 15000"
// - "king size wooden bed"
// - "dining table for 6"

/**
 * Parse natural language query to extract search criteria
 */
function parseVoiceQuery(query) {
  const lowerQuery = query.toLowerCase();
  
  // Extract budget (e.g., "under 15000", "below 20000", "price 10000")
  let budget = null;
  const budgetPatterns = [
    /under\s*(\d+)/i,
    /below\s*(\d+)/i,
    /under\s*rs\.?\s*(\d+)/i,
    /below\s*rs\.?\s*(\d+)/i,
    /price\s*(\d+)/i,
    /budget\s*(\d+)/i,
    /(\d+)\s*rupees/i,
    /₹\s*(\d+)/i
  ];
  
  for (const pattern of budgetPatterns) {
    const match = lowerQuery.match(pattern);
    if (match) {
      budget = parseInt(match[1].replace(/,/g, ''));
      break;
    }
  }
  
  // Extract room type
  const roomTypes = {
    'bedroom': ['bedroom', 'bed room', 'bed room', 'sleeping', 'bed', 'mattress'],
    'living room': ['living room', 'living', 'sofa', 'drawing room', 'lounge'],
    'dining': ['dining', 'dinner', 'dining table', 'dining chair'],
    'office': ['office', 'study', 'work', 'desk', 'executive'],
    'kids': ['kids', 'children', 'baby', 'kids room'],
    'kitchen': ['kitchen', 'modular kitchen'],
    'bathroom': ['bathroom', 'bath'],
    'outdoor': ['outdoor', 'garden', 'balcony', 'patio']
  };
  
  let roomType = null;
  for (const [room, keywords] of Object.entries(roomTypes)) {
    if (keywords.some(kw => lowerQuery.includes(kw))) {
      roomType = room;
      break;
    }
  }
  
  // Extract product type
  const productTypes = {
    'sofa': ['sofa', 'couch', 'settee', 'loveseat'],
    'bed': ['bed', 'king bed', 'queen bed', 'single bed', 'poster bed'],
    'table': ['table', 'dining table', 'coffee table', 'side table'],
    'chair': ['chair', 'seating', 'office chair', 'dining chair'],
    'wardrobe': ['wardrobe', 'closet', 'almirah', 'cabinet'],
    'mattress': ['mattress', 'bedding', 'sleeping pad'],
    'desk': ['desk', 'study table', 'workstation'],
    'tv unit': ['tv unit', 'tv stand', 'entertainment unit'],
    'bookshelf': ['bookshelf', 'book rack', 'shelf'],
    'dining set': ['dining set', 'dining table set'],
    'recliner': ['recliner', 'reclining'],
    'storage': ['storage', 'cabinet', 'drawer']
  };
  
  let productType = null;
  for (const [type, keywords] of Object.entries(productTypes)) {
    if (keywords.some(kw => lowerQuery.includes(kw))) {
      productType = type;
      break;
    }
  }
  
  // Extract size
  let size = null;
  const sizePatterns = [
    { pattern: /(\d+)\s*seater/, type: 'seater' },
    { pattern: /king\s*size/i, type: 'king' },
    { pattern: /queen\s*size/i, type: 'queen' },
    { pattern: /single/i, type: 'single' },
    { pattern: /double/i, type: 'double' },
    { pattern: /small/i, type: 'small' },
    { pattern: /medium/i, type: 'medium' },
    { pattern: /large/i, type: 'large' }
  ];
  
  for (const { pattern, type } of sizePatterns) {
    if (pattern.test(lowerQuery)) {
      size = type;
      break;
    }
  }
  
  // Extract material
  let material = null;
  const materialPatterns = [
    { pattern: /sheesham/i, type: 'sheesham' },
    { pattern: /teak/i, type: 'teak' },
    { pattern: /oak/i, type: 'oak' },
    { pattern: /walnut/i, type: 'walnut' },
    { pattern: /mahogany/i, type: 'mahogany' },
    { pattern: /mango/i, type: 'mango' },
    { pattern: /metal/i, type: 'metal' },
    { pattern: /glass/i, type: 'glass' },
    { pattern: /leather/i, type: 'leather' },
    { pattern: /fabric/i, type: 'fabric' },
    { pattern: /wooden|wood/i, type: 'wood' }
  ];
  
  for (const { pattern, type } of materialPatterns) {
    if (pattern.test(lowerQuery)) {
      material = type;
      break;
    }
  }
  
  // Extract style
  let style = null;
  const stylePatterns = [
    { pattern: /modern/i, type: 'modern' },
    { pattern: /contemporary/i, type: 'contemporary' },
    { pattern: /classic|traditional/i, type: 'classic' },
    { pattern: /minimal/i, type: 'minimal' },
    { pattern: /scandinavian/i, type: 'scandinavian' },
    { pattern: /industrial/i, type: 'industrial' },
    { pattern: /rustic/i, type: 'rustic' },
    { pattern: /luxury|premium/i, type: 'luxury' }
  ];
  
  for (const { pattern, type } of stylePatterns) {
    if (pattern.test(lowerQuery)) {
      style = type;
      break;
    }
  }
  
  return {
    budget,
    roomType,
    productType,
    size,
    material,
    style,
    rawQuery: query
  };
}

/**
 * Build MongoDB query from parsed criteria
 */
function buildProductQuery(criteria) {
  const query = {};
  
  // Price range
  if (criteria.budget) {
    query.basePrice = { $lte: criteria.budget };
  }
  
  // Category/room type mapping
  if (criteria.roomType) {
    const categoryMap = {
      'bedroom': 'bedroom',
      'living room': 'living',
      'dining': 'dining',
      'office': 'office',
      'kids': 'kids'
    };
    query.category = categoryMap[criteria.roomType];
  }
  
  // Product type in name or description
  if (criteria.productType) {
    query.$or = [
      { name: { $regex: criteria.productType, $options: 'i' } },
      { description: { $regex: criteria.productType, $options: 'i' } },
      { category: { $regex: criteria.productType, $options: 'i' } }
    ];
  }
  
  // Material
  if (criteria.material) {
    query.$or = query.$or || [];
    query.$or.push(
      { material: { $regex: criteria.material, $options: 'i' } },
      { description: { $regex: criteria.material, $options: 'i' } }
    );
  }
  
  return query;
}

/**
 * Main voice search endpoint
 */
router.get('/voice-search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query'
      });
    }
    
    console.log('Voice Search Query:', q);
    
    // Parse the natural language query
    const criteria = parseVoiceQuery(q);
    console.log('Parsed Criteria:', criteria);
    
    // Build product query
    const productQuery = buildProductQuery(criteria);
    console.log('Product Query:', JSON.stringify(productQuery));
    
    // Search products
    let products = await Product.find(productQuery)
      .sort({ popularity: -1, createdAt: -1 })
      .limit(20)
      .lean();
    
    // If no results, try broader search
    if (products.length === 0) {
      // Try searching just by keywords in name/description
      const keywordQuery = {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } }
        ]
      };
      
      if (criteria.budget) {
        keywordQuery.basePrice = { $lte: criteria.budget };
      }
      
      products = await Product.find(keywordQuery)
        .sort({ popularity: -1, createdAt: -1 })
        .limit(20)
        .lean();
    }
    
    // If still no results, return all products in budget
    if (products.length === 0 && criteria.budget) {
      products = await Product.find({ basePrice: { $lte: criteria.budget } })
        .sort({ popularity: -1 })
        .limit(20)
        .lean();
    }
    
    // Format response
    const formattedProducts = products.map(p => ({
      _id: p._id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      basePrice: p.basePrice,
      price: p.basePrice,
      mrp: p.mrp,
      images: p.images,
      category: p.category,
      rating: p.rating || 4.5,
      reviewCount: p.reviewCount || 0,
      inStock: p.inStock !== false
    }));
    
    res.json({
      success: true,
      query: q,
      criteria,
      count: formattedProducts.length,
      products: formattedProducts
    });
    
  } catch (error) {
    console.error('Voice Search Error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed. Please try again.',
      error: error.message
    });
  }
});

/**
 * Smart Cart Builder - AI-powered complete room setup builder
 * Example: "Complete bedroom setup under 50000"
 */
router.get('/smart-cart', async (req, res) => {
  try {
    const { room, budget } = req.query;
    
    if (!room) {
      return res.status(400).json({
        success: false,
        message: 'Please specify a room type (e.g., bedroom, living room)'
      });
    }
    
    const roomLower = room.toLowerCase();
    const maxBudget = budget ? parseInt(budget) : 50000;
    
    console.log(`Building smart cart for ${room} under ${maxBudget}`);
    
    // Define essential items for each room type
    const roomEssentials = {
      'bedroom': [
        { type: 'bed', priority: 1, weight: 0.4 },
        { type: 'mattress', priority: 2, weight: 0.25 },
        { type: 'wardrobe', priority: 3, weight: 0.2 },
        { type: 'nightstand', priority: 4, weight: 0.1 },
        { type: 'bedside table', priority: 4, weight: 0.05 }
      ],
      'living room': [
        { type: 'sofa', priority: 1, weight: 0.5 },
        { type: 'coffee table', priority: 2, weight: 0.2 },
        { type: 'tv unit', priority: 3, weight: 0.2 },
        { type: 'chair', priority: 4, weight: 0.1 }
      ],
      'dining': [
        { type: 'dining table', priority: 1, weight: 0.5 },
        { type: 'dining chair', priority: 2, weight: 0.3 },
        { type: 'cabinet', priority: 3, weight: 0.2 }
      ],
      'office': [
        { type: 'desk', priority: 1, weight: 0.4 },
        { type: 'office chair', priority: 2, weight: 0.3 },
        { type: 'bookshelf', priority: 3, weight: 0.2 },
        { type: 'storage', priority: 4, weight: 0.1 }
      ]
    };
    
    // Find matching room type
    let essentials = null;
    for (const [roomKey, items] of Object.entries(roomEssentials)) {
      if (roomLower.includes(roomKey) || roomKey.includes(roomLower)) {
        essentials = items;
        break;
      }
    }
    
    if (!essentials) {
      // Default to bedroom if no match
      essentials = roomEssentials['bedroom'];
    }
    
    // Calculate budget allocation based on weights
    const budgetPerItem = {};
    essentials.forEach(item => {
      budgetPerItem[item.type] = Math.floor(maxBudget * item.weight);
    });
    
    // Find products for each item type
    const cartItems = [];
    let totalPrice = 0;
    
    for (const item of essentials) {
      const itemBudget = budgetPerItem[item.type];
      
      // Search for products matching the item type
      const products = await Product.find({
        $or: [
          { name: { $regex: item.type, $options: 'i' } },
          { category: { $regex: item.type, $options: 'i' } },
          { description: { $regex: item.type, $options: 'i' } }
        ],
        basePrice: { $lte: itemBudget },
        inStock: { $ne: false }
      })
      .sort({ popularity: -1, rating: -1 })
      .limit(1)
      .lean();
      
      if (products.length > 0) {
        const product = products[0];
        cartItems.push({
          product: {
            _id: product._id,
            name: product.name,
            slug: product.slug,
            basePrice: product.basePrice,
            images: product.images
          },
          quantity: 1,
          itemType: item.type,
          priority: item.priority
        });
        totalPrice += product.basePrice;
      }
    }
    
    // If over budget, try reducing quantities or removing lower priority items
    let attempts = 0;
    while (totalPrice > maxBudget && cartItems.length > 1 && attempts < 3) {
      // Remove lowest priority item
      const lowestPriority = cartItems.reduce((min, item) => 
        item.priority < min.priority ? item : min, cartItems[0]);
      
      totalPrice -= lowestPriority.product.basePrice;
      cartItems.splice(cartItems.indexOf(lowestPriority), 1);
      attempts++;
    }
    
    res.json({
      success: true,
      room: room,
      budget: maxBudget,
      totalPrice,
      savings: maxBudget - totalPrice,
      items: cartItems,
      itemCount: cartItems.length,
      message: cartItems.length > 0 
        ? `Found ${cartItems.length} items for your ${room}`
        : 'No complete setup found within budget. Try increasing budget or changing room type.'
    });
    
  } catch (error) {
    console.error('Smart Cart Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to build cart. Please try again.',
      error: error.message
    });
  }
});

module.exports = router;

