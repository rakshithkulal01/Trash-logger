import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportOptions {
  filename?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Generate and download a PDF from the report view
 * @param elementId - The ID of the HTML element to capture
 * @param options - Export options including filename and date range
 */
export async function generateReportPDF(
  elementId: string,
  options: PDFExportOptions = {}
): Promise<void> {
  const element = document.getElementById(elementId);
  
  if (!element) {
    throw new Error(`Element with ID "${elementId}" not found`);
  }

  // Create canvas from the element
  const canvas = await html2canvas(element, {
    scale: 2, // Higher quality
    useCORS: true, // Allow cross-origin images
    logging: false,
    backgroundColor: '#ffffff',
  });

  // Calculate PDF dimensions
  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  // Create PDF
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  // Add title page
  pdf.setFontSize(20);
  pdf.text('Community Trash Logger Report', 105, 20, { align: 'center' });
  
  // Add date range if provided
  if (options.dateRange) {
    pdf.setFontSize(12);
    const startDate = options.dateRange.start.toLocaleDateString();
    const endDate = options.dateRange.end.toLocaleDateString();
    pdf.text(`Date Range: ${startDate} - ${endDate}`, 105, 30, { align: 'center' });
  }
  
  // Add generation timestamp
  pdf.setFontSize(10);
  const timestamp = new Date().toLocaleString();
  pdf.text(`Generated: ${timestamp}`, 105, 40, { align: 'center' });
  
  // Add the captured content
  let heightLeft = imgHeight;
  let position = 50; // Start below the header
  
  // Add image to PDF
  const imgData = canvas.toDataURL('image/png');
  
  if (heightLeft < pageHeight - position) {
    // Content fits on one page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  } else {
    // Content spans multiple pages
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - position);
    
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
  }
  
  // Generate filename
  const filename = options.filename || `trash-report-${Date.now()}.pdf`;
  
  // Download the PDF
  pdf.save(filename);
}

/**
 * Format date for filename
 */
export function formatDateForFilename(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
