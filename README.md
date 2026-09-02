# Certificate Maker Pro

Build a One-Page Certificate Generation Portal

Project Overview

Develop a modern, responsive one-page Certificate Generation Portal using React + Vite + TypeScript + Tailwind CSS.

The portal will generate professional certificates based on a single fixed certificate template (like the attached Ministry of Health certificate). The design, wording, spacing, borders, and layout must remain exactly the same as the template.

The only dynamic fields are:

 Organization Logo (uploaded by Admin)

 Authorized Signature (uploaded by Admin)

 Applicant Name

 Training/Certificate Name

 Generated Date (current date)

 QR Code

 Certificate Number

Everything else remains unchanged.

No backend should be used.

All data must be stored using Local Storage.

UI Layout

The application should be a single page divided into two sections.

---------------------------------------------------------
 Certificate Details          Live Certificate Preview

 Applicant Details            A4 Certificate Preview

 Generate Certificate

 Download PDF
 Print

---------------------------------------------------------

The preview updates instantly as the user types.

Certificate Template

Use the attached certificate as the exact design reference.

Keep unchanged:

 Border

 Background

 Watermark

 Certificate wording

 Text alignment

 Font positioning

 Seal location

 Signature position

 QR position

Only replace the dynamic fields.

Dynamic Fields

Admin Controlled

These are uploaded once and saved in Local Storage.

 Organization Logo

 Signature Image

These should automatically appear on every certificate.

Applicant Information

Display a form containing:

Applicant Name

Certificate Type

Generate Button

The Certificate Type is selected from available certificates.

Examples

Food Handler Certificate

Public Health and Hygiene

Work Ethics Certificate

Fire Safety Training

Customer Service

Occupational Safety

Basic First Aid

The selected certificate becomes the training name on the certificate.

Generated Fields

The system automatically generates:

Current Date

Example

05 August 2026

Certificate Number

Example

MOH-2026-000001

Each generated certificate increments automatically.

QR Code

Contains

Certificate Number

Applicant Name

Training

Date

Live Preview

As the applicant types

John Musa Okello

The preview immediately updates.

If they choose

Food Handler Certificate

The certificate instantly displays

FOOD HANDLER CERTIFICATE

without refreshing.

Admin Panel

Create a simple hidden Admin Settings modal.

Password (hardcoded for demo)

admin123

Admin can

Upload Logo

Upload Signature

Change Organization Name

Change Ministry Name

Reset Certificate Counter

Export Local Storage

Import Local Storage

Everything saved in Local Storage.

Local Storage Structure

adminSettings

{
 logo:"",
 signature:"",
 organization:"Republic of Kenya",
 ministry:"Ministry of Health"
}

certificateCounter

1

generatedCertificates

[
 {
   id:"",
   name:"",
   certificate:"",
   date:"",
   qr:"",
   createdAt:""
 }
]

Certificate Number Format

MOH-2026-000001

MOH-2026-000002

MOH-2026-000003

Auto increment.

QR Code

Generate automatically.

QR stores

Certificate Number

Applicant Name

Certificate

Generated Date

Download

Buttons

Generate Certificate

Download PDF

Download PNG

Print

PDF should maintain perfect A4 quality.

Validation

Applicant Name required.

Certificate required.

Prevent empty generation.

Show success notification.

Animations

Smooth fade-in

Card hover

Loading spinner during generation

Button ripple

Success animation after generation

Responsive Design

Desktop

Two-column layout.

Tablet

Stacked layout.

Mobile

Preview below the form.

Certificate preview should remain A4 scaled.

Theme

Professional government look.

White cards.

Soft shadows.

Rounded corners.

Minimal icons.

Blue primary buttons.

Elegant typography.

Project Structure

src/

components/

CertificatePreview.tsx

CertificateForm.tsx

AdminModal.tsx

Header.tsx

Footer.tsx

QRCodeGenerator.tsx

utils/

certificate.ts

localStorage.ts

pdf.ts

constants.ts

types/

Certificate.ts

pages/

Home.tsx

assets/

certificate-template.png

Libraries

Use only

 React

 TypeScript

 Tailwind CSS

 html2canvas

 jsPDF

 qrcode

 react-icons

Do not use Firebase or any backend.

Additional Features

 Auto-save applicant details while typing.

 Recent Certificates section showing the last 10 generated certificates.

 Search certificates by applicant name or certificate number.

 Re-download previously generated certificates from Local Storage.

 "Generate Another Certificate" button that clears the form but retains admin settings.

 Dark/Light mode toggle (certificate preview always remains white for printing).

 Loading indicators and toast notifications for uploads and generation.

Expected Outcome

The final application should look like a professional government certificate generator where:

 The certificate template remains identical to the provided design.

 Only the logo, signature, applicant name, certificate/training name, generated date, QR code, and certificate number change.

 All settings and generated records persist in Local Storage.

 Users can instantly preview, generate, print, and download certificates without needing a server or database.

Default Signature Image

To set a default signature for all certificates, place your signature image file at `src/assets/sign.png` (file name must be `sign.png`). The app imports this asset as the default authorized signature; admins can still change it via the Admin modal.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/acdacbc0-ec78-4d8d-8c9c-154ca1c2dd45).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Paylor (M-Pesa) proxy for STK Push

This project includes a small local proxy to forward STK Push and transaction queries to Paylor so the frontend does not call Paylor directly (browsers will block those requests due to CORS) and your API key remains server-side.

Quick setup

1. Copy the example env and fill your keys:

```bash
cp .env.example .env
# edit .env and set PAYLOR_API_KEY and PAYLOR_WEBHOOK_SECRET
```

2. Install proxy dependencies and start the proxy:

```bash
npm run setup-proxy
npm run start:proxy
```

3. Start the frontend in another terminal:

```bash
npm run dev
```

Notes

- The proxy runs on `PORT` from `.env` (default 3000) and accepts requests from `FRONTEND_ORIGIN`.
- The frontend calls `/api/stk-push` and `/api/transactions/:txId` (no API key in client).
- Webhooks are received at `/api/webhook` and verified using `PAYLOR_WEBHOOK_SECRET`.

Security

- Keep `PAYLOR_API_KEY` and `PAYLOR_WEBHOOK_SECRET` out of version control.
- Use HTTPS in production and deploy the proxy to a secure server for production use.
