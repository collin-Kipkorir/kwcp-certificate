export interface AdminSettings {
  logo: string;
  signature: string;
  seal: string;
  watermark: string;
  organization: string;
  ministry: string;
}

export interface GeneratedCertificate {
  id: string;
  name: string;
  certificate: string;
  date: string;
  qr: string;
  createdAt: string;
}

export interface CertificateDraft {
  name: string;
  certificate: string;
}