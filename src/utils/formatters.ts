import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formats a number as currency.
 * Uses the browser's locale or falls back to 'es-CL'.
 */
export const formatCurrency = (amount: number, currency: string = 'CLP'): string => {
    const browserLocale = navigator.language || 'es-CL';
    return new Intl.NumberFormat(browserLocale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

/**
 * Formats a date string to a readable format.
 * Handles UTC strings and local date strings consistently.
 */
export const formatDate = (dateString: string): string => {
    if (!dateString) return '';

    try {
        // parseISO handles YYYY-MM-DD and full ISO strings
        const date = parseISO(dateString);

        if (isNaN(date.getTime())) return 'Fecha inválida';

        const browserLocale = navigator.language || 'es-CL';
        return new Intl.DateTimeFormat(browserLocale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).format(date);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Error fecha';
    }
};

/**
 * Returns the month and year name for a given date.
 */
export const getMonthName = (date: Date): string => {
    const browserLocale = navigator.language || 'es-CL';
    return new Intl.DateTimeFormat(browserLocale, {
        month: 'long',
        year: 'numeric'
    }).format(date);
};
