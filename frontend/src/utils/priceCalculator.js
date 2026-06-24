// Safe price calculator with optional chaining
export const calculatePrice = (
  basePrice,
  wood,
  size,
  finish,
  product
) => {
  let price = basePrice || 0;

  if (product?.woodOptions?.length) {
    price += product.woodOptions.find(w => w.type === wood)?.extraPrice || 0;
  }

  if (product?.sizeOptions?.length) {
    price += product.sizeOptions.find(s => s.type === size)?.extraPrice || 0;
  }

  if (product?.finishOptions?.length) {
    price += product.finishOptions.find(f => f.type === finish)?.extraPrice || 0;
  }

  return price;
};