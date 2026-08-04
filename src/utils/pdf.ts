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
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  pdf.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPEG", 0, 0, w, h, undefined, "FAST");
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