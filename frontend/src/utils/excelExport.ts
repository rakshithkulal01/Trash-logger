import { utils, writeFile, write } from 'xlsx';
import { saveAs } from 'file-saver';
import { TrashEntry, Statistics } from '../types';
import { generateReportPDF } from './pdfExport';

export interface ExcelExportOptions {
  filename?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeStatistics?: boolean;
}

/**
 * Generate and download an Excel file with detailed trash data
 */
export async function generateExcelReport(
  entries: TrashEntry[],
  statistics?: Statistics,
  options: ExcelExportOptions = {}
): Promise<void> {
  try {
    // Create a new workbook
    const workbook = utils.book_new();

  // Prepare trash entries data
  const trashData = entries.map((entry, index) => ({
    'S.No': index + 1,
    'Entry ID': entry.id,
    'Trash Type': formatTrashType(entry.trash_type),
    'Latitude': entry.latitude.toFixed(6),
    'Longitude': entry.longitude.toFixed(6),
    'Location': `${entry.latitude.toFixed(6)}, ${entry.longitude.toFixed(6)}`,
    'Date Logged': new Date(entry.timestamp).toLocaleDateString('en-IN'),
    'Time Logged': new Date(entry.timestamp).toLocaleTimeString('en-IN'),
    'Full Timestamp': new Date(entry.timestamp).toLocaleString('en-IN'),
    'Logged By': entry.user_name || 'Anonymous',
    'Has Photo': entry.photo_url ? 'Yes' : 'No',
    'Photo URL': entry.photo_url || 'N/A'
  }));

  // Create trash entries worksheet
  const trashWorksheet = utils.json_to_sheet(trashData);

  // Set column widths for better readability
  const trashColWidths = [
    { wch: 6 },   // S.No
    { wch: 25 },  // Entry ID
    { wch: 15 },  // Trash Type
    { wch: 12 },  // Latitude
    { wch: 12 },  // Longitude
    { wch: 25 },  // Location
    { wch: 12 },  // Date Logged
    { wch: 12 },  // Time Logged
    { wch: 20 },  // Full Timestamp
    { wch: 15 },  // Logged By
    { wch: 10 },  // Has Photo
    { wch: 30 }   // Photo URL
  ];
  trashWorksheet['!cols'] = trashColWidths;

  // Add the trash entries worksheet
  utils.book_append_sheet(workbook, trashWorksheet, 'Trash Entries');

  // Add statistics worksheet if provided
  if (statistics && options.includeStatistics) {
    const statsData = [
      { 'Metric': 'Total Entries', 'Value': statistics.total_count },
      { 'Metric': 'Most Common Type', 'Value': formatTrashType(statistics.most_common_type) },
      { 'Metric': '', 'Value': '' }, // Empty row
      { 'Metric': 'TYPE BREAKDOWN', 'Value': '' },
    ];

    // Add type breakdown
    Object.entries(statistics.type_breakdown).forEach(([type, count]) => {
      statsData.push({
        'Metric': formatTrashType(type),
        'Value': count.toString()
      });
    });

    // Add empty row and hotspots
    statsData.push({ 'Metric': '', 'Value': '' });
    statsData.push({ 'Metric': 'TOP HOTSPOTS', 'Value': '' });

    statistics.hotspots.slice(0, 10).forEach((hotspot, index) => {
      statsData.push({
        'Metric': `Hotspot ${index + 1}`,
        'Value': `${hotspot.latitude.toFixed(6)}, ${hotspot.longitude.toFixed(6)} (${hotspot.count} items)`
      });
    });

    const statsWorksheet = utils.json_to_sheet(statsData);
    statsWorksheet['!cols'] = [{ wch: 20 }, { wch: 30 }];
    utils.book_append_sheet(workbook, statsWorksheet, 'Statistics');
  }

  // Add summary worksheet
  const summaryData = [
    { 'Field': 'Report Title', 'Value': 'Mangalore Trash Logger Report' },
    { 'Field': 'Generated On', 'Value': new Date().toLocaleString('en-IN') },
    { 'Field': 'Total Entries', 'Value': entries.length },
    { 'Field': 'Date Range', 'Value': options.dateRange 
      ? `${options.dateRange.start.toLocaleDateString('en-IN')} to ${options.dateRange.end.toLocaleDateString('en-IN')}`
      : 'All Time' },
    { 'Field': '', 'Value': '' },
    { 'Field': 'LOCATION COVERAGE', 'Value': '' },
    { 'Field': 'Region', 'Value': 'Mangalore, Karnataka, India' },
    { 'Field': 'Coordinate System', 'Value': 'WGS84 (Decimal Degrees)' },
    { 'Field': '', 'Value': '' },
    { 'Field': 'DATA FIELDS EXPLANATION', 'Value': '' },
    { 'Field': 'Entry ID', 'Value': 'Unique identifier for each trash entry' },
    { 'Field': 'Trash Type', 'Value': 'Category of trash (Plastic, Glass, Paper, etc.)' },
    { 'Field': 'Latitude/Longitude', 'Value': 'GPS coordinates in decimal degrees' },
    { 'Field': 'Location', 'Value': 'Combined lat,lng for easy copying to maps' },
    { 'Field': 'Timestamp', 'Value': 'Date and time when trash was logged' },
    { 'Field': 'Logged By', 'Value': 'Name of person who logged the entry (or Anonymous)' },
    { 'Field': 'Has Photo', 'Value': 'Whether a photo was uploaded with the entry' }
  ];

  const summaryWorksheet = utils.json_to_sheet(summaryData);
  summaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 50 }];
  utils.book_append_sheet(workbook, summaryWorksheet, 'Report Info');

  // Generate filename
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = options.filename || `mangalore-trash-report-${timestamp}.xlsx`;

  // Convert workbook to array buffer
  const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });

    // Create blob and save
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    saveAs(blob, filename);
  } catch (error) {
    console.error('Excel export error:', error);
    throw new Error(`Failed to generate Excel report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Format trash type for display
 */
function formatTrashType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generate a combined report with both PDF and Excel
 */
export async function generateCombinedReport(
  entries: TrashEntry[],
  statistics: Statistics,
  pdfElementId: string,
  options: ExcelExportOptions = {}
): Promise<void> {
  // Generate both reports
  const timestamp = new Date().toISOString().split('T')[0];
  const baseName = `mangalore-trash-report-${timestamp}`;
  
  // Generate Excel report first
  await generateExcelReport(entries, statistics, {
    ...options,
    filename: `${baseName}.xlsx`,
    includeStatistics: true
  });
  
  // Generate PDF report
  await generateReportPDF(pdfElementId, {
    ...options,
    filename: `${baseName}.pdf`
  });
}

/**
 * Export only the trash entries as a simple CSV for quick analysis
 */
export function exportTrashEntriesCSV(entries: TrashEntry[], filename?: string): void {
  const csvData = entries.map((entry, index) => ({
    'S.No': index + 1,
    'ID': entry.id,
    'Type': formatTrashType(entry.trash_type),
    'Latitude': entry.latitude,
    'Longitude': entry.longitude,
    'Date': new Date(entry.timestamp).toLocaleDateString('en-IN'),
    'Time': new Date(entry.timestamp).toLocaleTimeString('en-IN'),
    'User': entry.user_name || 'Anonymous'
  }));

  const worksheet = utils.json_to_sheet(csvData);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Trash Data');

  const timestamp = new Date().toISOString().split('T')[0];
  const csvFilename = filename || `trash-entries-${timestamp}.csv`;
  
  writeFile(workbook, csvFilename);
}