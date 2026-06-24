export const toastMessages = {
  addedToCart: (name) => `Added to cart${name ? `: ${name}` : ''}`,
  removedFromCart: (name) => `Removed from cart${name ? `: ${name}` : ''}`,
  alreadyInCart: (name) => `Already in cart${name ? `: ${name}` : ''}`,

  addedToWishlist: (name) => `Saved to wishlist${name ? `: ${name}` : ''}`,
  removedFromWishlist: (name) => `Removed from wishlist${name ? `: ${name}` : ''}`,
  alreadyInWishlist: (name) => `Already in wishlist${name ? `: ${name}` : ''}`,
};

