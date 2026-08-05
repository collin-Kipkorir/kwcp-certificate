import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

async function snapshot(node: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(node, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });
}

export async function downloadPdf(node: HTMLElement, fileName: string) {
  const canvas = await snapshot(node);
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const margin = 5; // small 5mm margin
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;
  const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
  const w = canvas.width * ratio;
  const h = canvas.height * ratio;
  const x = (pageW - w) / 2;
  const y = (pageH - h) / 2;
  pdf.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPEG", x, y, w, h, undefined, "FAST");
  pdf.save(`${fileName}.pdf`);
}

export async function downloadPng(node: HTMLElement, fileName: string) {
  const canvas = await snapshot(node);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${fileName}.png`;
  link.click();
}

export function printCertificate() {
  window.print();
}