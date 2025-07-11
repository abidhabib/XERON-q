export const RemoveTrailingZeros = (num) => {
    if (typeof num === 'string') {
        num = parseFloat(num);
    }

    if (typeof num !== 'number' || isNaN(num)) {
        console.error('Invalid input, expected a number:', num);
        return num;
    }

    // Truncate to 5 decimals without rounding
    const truncated = Math.floor(num * 1000000) / 1000000;

    // Convert to string and remove unnecessary trailing zeros
    return truncated.toString().replace(/(\.\d*?[1-9])0+$|\.0*$/, '$1');
};