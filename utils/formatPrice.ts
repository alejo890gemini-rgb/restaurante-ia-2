export const formatPrice = (price: number): string => {
  // Formats the number to COP (e.g., 50000 -> $ 50.000)
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(price);
};
