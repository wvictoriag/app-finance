import { Transaction } from '../types';
import { format } from 'date-fns';

export const exportTransactionsToCSV = (transactions: Transaction[]) => {
    // Define headers
    const headers = ['Fecha', 'Descripción', 'Categoría', 'Cuenta', 'Monto', 'Tipo'];

    // Format data rows
    const rows = transactions.map(tx => {
        const date = format(new Date(tx.date), 'yyyy-MM-dd');
        const description = (tx.description || '').replace(/"/g, '""'); // Escape quotes
        const category = (tx.categories?.name || 'Sin Categoría').replace(/"/g, '""');
        const account = (tx.accounts?.name || 'Sin Cuenta').replace(/"/g, '""');
        const amount = Number(tx.amount);
        const type = tx.destination_account_id ? 'Transferencia' : amount >= 0 ? 'Ingreso' : 'Egreso';

        return [
            date,
            `"${description}"`,
            `"${category}"`,
            `"${account}"`,
            amount,
            `"${type}"`
        ].join(',');
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');

    // Create a Blob and download (Adding UTF-8 BOM for Excel compatibility)
    const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `transacciones_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
