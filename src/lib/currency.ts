export function formatCurrency(amount: number, currency: string = 'PHP'): string {
  const symbols: Record<string, string> = {
    PHP: '', // ✅ Changed from '$' to '₱'
    USD: '$',
    EUR: '€',
  };

  const symbol = symbols[currency] || currency;

  if (currency === 'PHP') {
    return `${symbol}${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCurrencySimple(amount: number, currency: string = 'PHP'): string {
  const symbols: Record<string, string> = {
    PHP: '₱', // ✅ Changed from '$' to '₱'
    USD: '$',
    EUR: '€',
  };

  const symbol = symbols[currency] || currency;
  return `${symbol}${amount.toFixed(2)}`;
}