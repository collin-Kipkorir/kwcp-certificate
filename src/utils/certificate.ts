export function formatCertificateDate(d: Date = new Date()): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export function buildCertificateNumber(counter: number, date: Date = new Date()): string {
  return `MOH-${date.getFullYear()}-${String(counter).padStart(6, "0")}`;
}

export function buildQrPayload(input: {
  id: string;
  name: string;
  certificate: string;
  date: string;
}): string {
  return [
    `Certificate No: ${input.id}`,
    `Name: ${input.name}`,
    `Training: ${input.certificate}`,
    `Date: ${input.date}`,
  ].join("\n");
}