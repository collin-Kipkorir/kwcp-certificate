export interface AdminSettings {
  logo: string;
  signature: string;
  seal: string;
  watermark: string;
  organization: string;
  ministry: string;
  // Paylor credentials (optional) — managed by admin only
  paylorApiKey?: string;
  paylorChannelId?: string;
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

export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  nationalId: string;
  county: string;
  createdAt: string;
}

export interface StoredUser extends AppUser {
  passwordHash: string;
}

export interface PaymentRecord {
  certificateId: string;
  userId: string;
  amount: number;
  phone: string;
  receipt: string;
  paidAt: string;
}