import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportProposalToPdf(
  element: HTMLElement,
  filename: string = 'Orcamento_3D.pdf',
  onProgress?: (status: string) => void
): Promise<boolean> {
  try {
    if (onProgress) onProgress('Preparando documento sem margens...');

    // Temporarily ensure high quality render
    const originalWidth = element.style.width;
    element.style.width = '210mm';

    if (onProgress) onProgress('Renderizando em alta definição...');

    const canvas = await html2canvas(element, {
      scale: 2.2, // Alta nitidez para texto e linhas técnicas
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794, // 210mm at 96 DPI
      scrollX: 0,
      scrollY: 0,
    });

    element.style.width = originalWidth;

    if (onProgress) onProgress('Formatando páginas A4 sem margens...');

    const imgData = canvas.toDataURL('image/jpeg', 0.96);

    // Standard A4 dimensions in mm
    const pdfWidth = 210;
    const pdfHeight = 297;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    let heightLeft = imgHeight;
    let position = 0;

    // Page 1: zero margins (x: 0, y: 0)
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    // Subsequent pages if proposal is long
    while (heightLeft > 2) {
      position = heightLeft - imgHeight;
      pdf.addPage('a4', 'portrait');
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    if (onProgress) onProgress('Baixando PDF...');
    pdf.save(filename);

    return true;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
}
