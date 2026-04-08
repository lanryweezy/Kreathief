import { jsPDF } from 'jspdf';

self.onmessage = async (e: MessageEvent) => {
  const { width, height, imgDataUrl, fileName } = e.data;

  try {
    const orientation = width > height ? 'landscape' : 'portrait';
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'pt',
      format: [width, height],
    });

    pdf.addImage(imgDataUrl, 'PNG', 0, 0, width, height);
    const blob = pdf.output('blob');

    self.postMessage({ type: 'SUCCESS', payload: blob, fileName });
  } catch (error: any) {
    self.postMessage({ type: 'ERROR', error: error.message });
  }
};
