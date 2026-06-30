// Real CSV export — generates a file and triggers a browser download.
// Replaces the placeholder alert() calls in SalesView/InventoryView.

const escapeCell = (value: unknown): string => {
  const s = value == null ? '' : String(value);
  if (/[",\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
};

/**
 * Build a CSV string from headers + rows and download it as `filename`.
 * Uses `;` as separator (Excel pt-BR friendly) and prepends a UTF-8 BOM for accents.
 */
export const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]): void => {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(';'));
  const content = '﻿' + lines.join('\r\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
