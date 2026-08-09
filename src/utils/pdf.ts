import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

const SHEET_W = 1123;
const SHEET_H = 794;
const PDF_MARGIN_MM = 5;

function safeFileName(value: string): string {
  const cleaned = value
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "certificate";
}

/**
 * The on-screen sheet lives inside a CSS `scale()` wrapper, which makes
 * html2canvas capture it at the wrong size. Clone it into an off-screen
 * container rendered at full 1:1 size instead.
 */
async function snapshot(node: HTMLElement): Promise<HTMLCanvasElement> {
  const holder = document.createElement("div");
  holder.style.cssText = `position:fixed;left:-10000px;top:0;width:${SHEET_W}px;height:${SHEET_H}px;background:#fff;z-index:-1;`;
  const clone = node.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.style.transform = "none";
  clone.style.width = `${SHEET_W}px`;
  clone.style.height = `${SHEET_H}px`;
  holder.appendChild(clone);
  document.body.appendChild(holder);

  // let images in the clone settle
  await Promise.all(
    Array.from(clone.querySelectorAll("img")).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
          }),
    ),
  );

  try {
    return await html2canvas(clone, {
      scale: 2,
      width: SHEET_W,
      height: SHEET_H,
      windowWidth: SHEET_W,
      windowHeight: SHEET_H,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });
  } finally {
    document.body.removeChild(holder);
  }
}

export async function downloadPdf(node: HTMLElement, fileName: string) {
  const canvas = await snapshot(node);
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const maxW = pageW - PDF_MARGIN_MM * 2;
  const maxH = pageH - PDF_MARGIN_MM * 2;
  const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
  const w = canvas.width * ratio;
  const h = canvas.height * ratio;
  const x = (pageW - w) / 2;
  const y = (pageH - h) / 2;
  const image = canvas.toDataURL("image/jpeg", 0.96);
  pdf.addImage(image, "JPEG", x, y, w, h, undefined, "FAST");
  pdf.save(`${safeFileName(fileName)}.pdf`);
}

export async function downloadPng(node: HTMLElement, fileName: string) {
  const canvas = await snapshot(node);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${safeFileName(fileName)}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function printCertificate() {
  window.print();
}