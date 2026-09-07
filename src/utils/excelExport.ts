import * as XLSX from 'xlsx';
import { TangoEvent } from '../types';
import { convertPriceToUSD, formatTwoLineAddress } from './formatters';

/**
 * Exports an array of TangoEvent items to an Excel (.xlsx) file with professional formatting.
 */
export function exportEventsToExcel(events: TangoEvent[], customFileName?: string): boolean {
  try {
    const rows = events.map((ev, index) => {
      const usdInfo = convertPriceToUSD(ev.price, ev.is_free, ev.country_code);
      const addrInfo = formatTwoLineAddress(ev);

      return {
        'No': index + 1,
        'Event Name': ev.event_name,
        'Type': ev.event_type,
        'Start Date': (ev.start_date || '').replace(/-/g, '/'),
        'End Date': (ev.end_date || '').replace(/-/g, '/'),
        'Country': ev.country_code,
        'City': ev.city,
        'State': ev.state || '',
        'Address': ev.address,
        'Location': addrInfo.locationLine,
        'Price (USD)': usdInfo.usdFormatted,
        'Original Price': usdInfo.originalFormatted || ev.price,
        'Free': ev.is_free ? 'Yes' : 'No',
        'Source URL': ev.source_url,
        'Source Type': ev.source_type === 'AUTO_CRAWLED' ? 'Auto Crawled' : 'Manual',
        'Status': ev.status,
        'Notes': ev.notes || ''
      };
    });

    // Create Worksheet
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Set auto column widths
    const colWidths = [
      { wch: 5 },   // No
      { wch: 32 },  // Event Name
      { wch: 12 },  // Type
      { wch: 12 },  // Start Date
      { wch: 12 },  // End Date
      { wch: 8 },   // Country
      { wch: 14 },  // City
      { wch: 12 },  // State
      { wch: 35 },  // Address
      { wch: 20 },  // Location
      { wch: 16 },  // Price USD
      { wch: 15 },  // Original Price
      { wch: 8 },   // Free
      { wch: 35 },  // Source URL
      { wch: 18 },  // Source Type
      { wch: 10 },  // Status
      { wch: 40 },  // Notes
    ];
    worksheet['!cols'] = colWidths;

    // Create Workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tango Events');

    // Generate filename with current date stamp
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = customFileName || `EveryTango_Events_${dateStr}.xlsx`;

    // Download file directly
    XLSX.writeFile(workbook, fileName);
    return true;
  } catch (error) {
    console.error('Failed to export Excel file:', error);
    // Fallback to UTF-8 BOM CSV if XLSX fails in certain restricted sandbox environments
    return exportEventsToCSV(events, customFileName);
  }
}

/**
 * Fallback export to CSV with UTF-8 BOM for universal spreadsheet compatibility.
 */
export function exportEventsToCSV(events: TangoEvent[], customFileName?: string): boolean {
  try {
    const headers = [
      'No',
      'Event Name',
      'Type',
      'Start Date',
      'End Date',
      'Country',
      'City',
      'State',
      'Address',
      'Price (USD)',
      'Original Price',
      'Source URL',
      'Notes'
    ];

    const rows = events.map((ev, idx) => {
      const usd = convertPriceToUSD(ev.price, ev.is_free, ev.country_code);
      return [
        idx + 1,
        `"${(ev.event_name || '').replace(/"/g, '""')}"`,
        ev.event_type,
        (ev.start_date || '').replace(/-/g, '/'),
        (ev.end_date || '').replace(/-/g, '/'),
        ev.country_code,
        `"${(ev.city || '').replace(/"/g, '""')}"`,
        `"${(ev.state || '').replace(/"/g, '""')}"`,
        `"${(ev.address || '').replace(/"/g, '""')}"`,
        `"${usd.usdFormatted}"`,
        `"${(usd.originalFormatted || ev.price || '').replace(/"/g, '""')}"`,
        `"${(ev.source_url || '').replace(/"/g, '""')}"`,
        `"${(ev.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', (customFileName || `EveryTango_Events_${dateStr}.csv`).replace('.xlsx', '.csv'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Failed to export CSV fallback:', err);
    return false;
  }
}
