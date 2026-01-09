export const formatCurrencyValue = (amount, mode = 'INR') => {
    const value = Number(amount) || 0;

    if (mode === 'Points') {
        return `Pts ${value.toLocaleString('en-US')}`;
    }

    const symbol = '₹';

    if (mode === 'INR') {
        if (value >= 10000000) return `${symbol} ${(value / 10000000).toFixed(2)} Cr`;
        if (value >= 100000) return `${symbol} ${(value / 100000).toFixed(2)} L`;
        return `${symbol} ${value.toLocaleString('en-IN')}`;
    }

    if (mode === 'Standard') {
        if (value >= 1000000) return `${symbol} ${(value / 1000000).toFixed(2)} M`;
        if (value >= 1000) return `${symbol} ${(value / 1000).toFixed(2)} K`;
        return `${symbol} ${value.toLocaleString('en-US')}`;
    }

    // Default or Fallback
    return `${symbol} ${value.toLocaleString('en-US')}`;
};
