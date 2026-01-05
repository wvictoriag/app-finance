export const formatCurrency = (amount, currency = 'CLP') => {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export const formatDate = (dateString) => {
    if (!dateString) return '';
    // If it's already a full ISO string (contains T), just parse it.
    // Otherwise, append T12:00:00 to avoid timezone shifts for YYYY-MM-DD.
    const date = dateString.includes('T') ? new Date(dateString) : new Date(dateString + 'T12:00:00');

    // Check if date is valid
    if (isNaN(date.getTime())) return 'Fecha inválida';

    return new Intl.DateTimeFormat('es-CL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(date);
};

export const getMonthName = (date) => {
    return new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(date);
};
