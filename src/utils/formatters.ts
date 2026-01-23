import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formats a number as currency.
 * Adapts to the selected region (CL or CO) stored in localStorage.
 */
export const formatCurrency = (amount: number, currency?: string): string => {
    const region = localStorage.getItem('app_region') || 'CL';
    const isColombia = region === 'CO';

    // Colombia uses COP, Chile uses CLP
    const targetCurrency = currency || (isColombia ? 'COP' : 'CLP');
    const locale = isColombia ? 'es-CO' : 'es-CL';

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: targetCurrency,
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

        const region = localStorage.getItem('app_region') || 'CL';
        const locale = region === 'CO' ? 'es-CO' : 'es-CL';

        return new Intl.DateTimeFormat(locale, {
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
    const region = localStorage.getItem('app_region') || 'CL';
    const locale = region === 'CO' ? 'es-CO' : 'es-CL';

    return new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric'
    }).format(date);
};
