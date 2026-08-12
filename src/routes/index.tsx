import { createFileRoute } from "@tanstack/react-router";
import Home from "@/pages/Home";
import { AuthProvider } from "@/context/AuthContext";

const title = "KWCP — Kenya Workers Certification Portal";
const description =
  "Register, generate and download QR-verified Kenyan worker training certificates. Unlock instant A4 PDF downloads with M-Pesa STK Push payment.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <AuthProvider>
      <Home />
    </AuthProvider>
  );
}
