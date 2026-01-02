// Dilo App - Export Service
// Generates Excel (CSV), PDF (text), and HTML professional reports

import { DEFAULT_CATEGORIES } from '@/constants/categories';
import { Account, Category, Transaction } from '@/types';
import * as ExpoFileSystem from 'expo-file-system/legacy';
import * as ExpoSharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

interface ExportOptions {
    transactions: Transaction[];
    accounts: Account[];
    categories: Category[];
    startDate?: Date;
    endDate?: Date;
    format: 'csv' | 'pdf' | 'html';
}

// Format currency
const formatMoney = (amount: number, currency: 'USD' | 'VES' = 'USD'): string => {
    if (currency === 'VES') {
        return `Bs. ${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Format date
const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString('es-VE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
};

// Format date for display
const formatDisplayDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString('es-VE', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

// Get category name
const getCategoryName = (categoryId: string, categories: Category[]): string => {
    const category = categories.find(c => c.id === categoryId) ||
        DEFAULT_CATEGORIES.find(c => c.id === categoryId);
    return category?.name || 'Sin categoria';
};

// Get category color
const getCategoryColor = (categoryId: string, categories: Category[]): string => {
    const category = categories.find(c => c.id === categoryId) ||
        DEFAULT_CATEGORIES.find(c => c.id === categoryId);
    return category?.color || '#64748B';
};

// Get account name
const getAccountName = (accountId: string, accounts: Account[]): string => {
    return accounts.find(a => a.id === accountId)?.name || 'Sin cuenta';
};

/**
 * Generate CSV content from transactions
 */
export const generateCSV = (options: ExportOptions): string => {
    const { transactions, accounts, categories } = options;

    // CSV Header
    let csv = 'Fecha,Tipo,Categoria,Cuenta,Descripcion,Monto USD,Monto Bs,Tasa BCV\n';

    // CSV Rows
    transactions.forEach(t => {
        const type = t.type === 'income' ? 'Ingreso' : 'Gasto';
        const category = getCategoryName(t.categoryId, categories);
        const account = getAccountName(t.accountId, accounts);
        const description = t.description.replace(/,/g, ';').replace(/\n/g, ' ');
        const date = formatDate(t.createdAt);

        csv += `${date},${type},${category},${account},${description},${t.amountUsd.toFixed(2)},${t.amountVes.toFixed(2)},${t.bcvRateUsed.toFixed(2)}\n`;
    });

    return csv;
};

/**
 * Generate Professional HTML Report
 */
export const generateHTMLReport = (options: ExportOptions): string => {
    const { transactions, accounts, categories } = options;

    // Calculate totals
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amountUsd, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amountUsd, 0);

    const balance = totalIncome - totalExpense;
    const avgBcvRate = transactions.length > 0
        ? transactions.reduce((sum, t) => sum + t.bcvRateUsed, 0) / transactions.length
        : 0;

    // Group by category for expenses
    const byCategory: Record<string, { amount: number; count: number; color: string }> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        const catName = getCategoryName(t.categoryId, categories);
        const catColor = getCategoryColor(t.categoryId, categories);
        if (!byCategory[catName]) {
            byCategory[catName] = { amount: 0, count: 0, color: catColor };
        }
        byCategory[catName].amount += t.amountUsd;
        byCategory[catName].count += 1;
    });

    // Sort by amount descending
    const sortedCategories = Object.entries(byCategory).sort((a, b) => b[1].amount - a[1].amount);

    // Generate transaction rows HTML
    const transactionRows = transactions
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(t => {
            const isIncome = t.type === 'income';
            const amountClass = isIncome ? 'income' : 'expense';
            const prefix = isIncome ? '+' : '-';
            return `
                <tr>
                    <td>${formatDisplayDate(t.createdAt)}</td>
                    <td><span class="badge ${amountClass}">${isIncome ? 'Ingreso' : 'Gasto'}</span></td>
                    <td>${getCategoryName(t.categoryId, categories)}</td>
                    <td>${getAccountName(t.accountId, accounts)}</td>
                    <td>${t.description || '-'}</td>
                    <td class="${amountClass}">${prefix}${formatMoney(t.amountUsd)}</td>
                    <td class="muted">${formatMoney(t.amountVes, 'VES')}</td>
                </tr>
            `;
        }).join('');

    // Generate category breakdown rows
    const categoryRows = sortedCategories.map(([cat, data]) => {
        const percent = totalExpense > 0 ? ((data.amount / totalExpense) * 100).toFixed(1) : '0';
        return `
            <tr>
                <td><span class="color-dot" style="background: ${data.color}"></span> ${cat}</td>
                <td>${data.count}</td>
                <td>${formatMoney(data.amount)}</td>
                <td>${percent}%</td>
            </tr>
        `;
    }).join('');

    // Build HTML
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dilo - Reporte Financiero</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0B1120;
            color: #E2E8F0;
            padding: 40px;
            line-height: 1.6;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 30px;
            border-bottom: 1px solid #1E293B;
        }
        .logo {
            font-size: 32px;
            font-weight: 800;
            background: linear-gradient(135deg, #0EA5E9, #06B6D4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 8px;
        }
        .subtitle {
            color: #64748B;
            font-size: 14px;
        }
        .date-generated {
            color: #94A3B8;
            font-size: 12px;
            margin-top: 10px;
        }
        
        /* Summary Cards */
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 40px;
        }
        .summary-card {
            background: linear-gradient(135deg, #151C3B, #0B1026);
            border: 1px solid #1E293B;
            border-radius: 16px;
            padding: 24px;
            text-align: center;
        }
        .summary-card.income {
            border-left: 4px solid #10B981;
        }
        .summary-card.expense {
            border-left: 4px solid #F43F5E;
        }
        .summary-card.balance {
            border-left: 4px solid #0EA5E9;
        }
        .summary-card.rate {
            border-left: 4px solid #8B5CF6;
        }
        .summary-label {
            font-size: 12px;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }
        .summary-value {
            font-size: 24px;
            font-weight: 700;
        }
        .summary-value.income { color: #10B981; }
        .summary-value.expense { color: #F43F5E; }
        .summary-value.balance { color: #0EA5E9; }
        .summary-value.rate { color: #8B5CF6; }
        
        /* Section */
        .section {
            margin-bottom: 40px;
        }
        .section-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #F1F5F9;
        }
        
        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            background: #0F172A;
            border-radius: 12px;
            overflow: hidden;
        }
        th, td {
            padding: 14px 16px;
            text-align: left;
            border-bottom: 1px solid #1E293B;
        }
        th {
            background: #1E293B;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #94A3B8;
            font-weight: 600;
        }
        tr:last-child td {
            border-bottom: none;
        }
        tr:hover {
            background: #151C3B;
        }
        
        /* Badge */
        .badge {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .badge.income {
            background: rgba(16, 185, 129, 0.2);
            color: #10B981;
        }
        .badge.expense {
            background: rgba(244, 63, 94, 0.2);
            color: #F43F5E;
        }
        
        /* Colors */
        .income { color: #10B981; }
        .expense { color: #F43F5E; }
        .muted { color: #64748B; }
        
        .color-dot {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        /* Footer */
        .footer {
            text-align: center;
            margin-top: 60px;
            padding-top: 30px;
            border-top: 1px solid #1E293B;
            color: #475569;
            font-size: 12px;
        }
        
        @media print {
            body {
                background: white;
                color: #1E293B;
            }
            .summary-card, table, th {
                background: #F8FAFC;
            }
            .summary-card {
                border: 1px solid #E2E8F0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="logo">DILO</div>
            <div class="subtitle">Reporte Financiero Personal</div>
            <div class="date-generated">Generado el ${new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} a las ${new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}</div>
        </header>
        
        <div class="summary-grid">
            <div class="summary-card income">
                <div class="summary-label">Total Ingresos</div>
                <div class="summary-value income">${formatMoney(totalIncome)}</div>
            </div>
            <div class="summary-card expense">
                <div class="summary-label">Total Gastos</div>
                <div class="summary-value expense">${formatMoney(totalExpense)}</div>
            </div>
            <div class="summary-card balance">
                <div class="summary-label">Balance</div>
                <div class="summary-value balance">${formatMoney(balance)}</div>
            </div>
            <div class="summary-card rate">
                <div class="summary-label">Tasa Promedio</div>
                <div class="summary-value rate">${avgBcvRate.toFixed(2)} Bs/$</div>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">📊 Gastos por Categoría</h2>
            <table>
                <thead>
                    <tr>
                        <th>Categoría</th>
                        <th>Transacciones</th>
                        <th>Monto</th>
                        <th>%</th>
                    </tr>
                </thead>
                <tbody>
                    ${categoryRows || '<tr><td colspan="4" style="text-align: center; color: #64748B;">Sin gastos registrados</td></tr>'}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2 class="section-title">📋 Detalle de Transacciones (${transactions.length})</h2>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Categoría</th>
                        <th>Cuenta</th>
                        <th>Descripción</th>
                        <th>USD</th>
                        <th>Bolívares</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactionRows || '<tr><td colspan="7" style="text-align: center; color: #64748B;">No hay transacciones</td></tr>'}
                </tbody>
            </table>
        </div>
        
        <footer class="footer">
            <p>Generado por <strong>Dilo App</strong> v1.1</p>
            <p>Tu asistente financiero personal con comandos de voz</p>
        </footer>
    </div>
</body>
</html>
    `;

    return html;
};

/**
 * Generate text report (legacy PDF content)
 */
export const generatePDFContent = (options: ExportOptions): string => {
    const { transactions, categories } = options;

    // Calculate totals
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amountUsd, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amountUsd, 0);

    const balance = totalIncome - totalExpense;

    // Group by category
    const byCategory: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        const catName = getCategoryName(t.categoryId, categories);
        byCategory[catName] = (byCategory[catName] || 0) + t.amountUsd;
    });

    // Build report
    let report = 'DILO - REPORTE FINANCIERO\n';
    report += '==========================\n\n';
    report += `Generado: ${new Date().toLocaleDateString('es-VE')}\n`;
    report += `Transacciones: ${transactions.length}\n\n`;
    report += 'RESUMEN\n';
    report += '-------\n';
    report += `Total Ingresos:  ${formatMoney(totalIncome)}\n`;
    report += `Total Gastos:    ${formatMoney(totalExpense)}\n`;
    report += `Balance:         ${formatMoney(balance)}\n\n`;
    report += 'GASTOS POR CATEGORIA\n';
    report += '--------------------\n';

    Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, amount]) => {
            const percent = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : '0';
            report += `${cat}: ${formatMoney(amount)} (${percent}%)\n`;
        });

    report += '\n---\nDilo App v1.1\n';

    return report;
};

/**
 * Export transactions to file and share/save
 */
export const exportTransactions = async (options: ExportOptions): Promise<boolean> => {
    try {
        const { format } = options;
        const timestamp = new Date().toISOString().split('T')[0];

        let content: string;
        let filename: string;
        let mimeType: string;

        if (format === 'csv') {
            content = generateCSV(options);
            filename = `Dilo_Transacciones_${timestamp}.csv`;
            mimeType = 'text/csv';
        } else if (format === 'html') {
            content = generateHTMLReport(options);
            filename = `Dilo_Reporte_${timestamp}.html`;
            mimeType = 'text/html';
        } else {
            content = generatePDFContent(options);
            filename = `Dilo_Reporte_${timestamp}.txt`;
            mimeType = 'text/plain';
        }

        // Android: Use Storage Access Framework (SAF) for direct "Save as"
        if (Platform.OS === 'android') {
            const permissions = await ExpoFileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

            if (permissions.granted) {
                try {
                    const fileUri = await ExpoFileSystem.StorageAccessFramework.createFileAsync(
                        permissions.directoryUri,
                        filename,
                        mimeType
                    );

                    await ExpoFileSystem.writeAsStringAsync(fileUri, content, { encoding: 'utf8' });
                    Alert.alert('✓ Éxito', `Reporte guardado: ${filename}`);
                    return true;
                } catch (e) {
                    console.error('SAF Error:', e);
                    // Fallback to sharing if SAF fails
                }
            }
        }

        // iOS or Fallback: Save to temp and use Sharing
        const fileUri = ExpoFileSystem.documentDirectory + filename;
        await ExpoFileSystem.writeAsStringAsync(fileUri, content, { encoding: 'utf8' });

        const isAvailable = await ExpoSharing.isAvailableAsync();
        if (!isAvailable) {
            console.log('Sharing not available');
            return false;
        }

        await ExpoSharing.shareAsync(fileUri, {
            mimeType,
            dialogTitle: 'Exportar reporte Dilo',
            UTI: format === 'csv' ? 'public.comma-separated-values-text' : format === 'html' ? 'public.html' : 'public.plain-text',
        });

        return true;
    } catch (error) {
        console.error('Export error:', error);
        return false;
    }
};

/**
 * Filter transactions by date range
 */
export const filterByDateRange = (
    transactions: Transaction[],
    period: 'week' | 'month' | 'year' | 'all'
): Transaction[] => {
    if (period === 'all') return transactions;

    const now = new Date();
    let startDate: Date;

    switch (period) {
        case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
    }

    return transactions.filter(t => new Date(t.createdAt) >= startDate);
};
