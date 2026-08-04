import { createFileRoute } from "@tanstack/react-router";
import Home from "@/pages/Home";

const title = "Certificate Generation Portal | Instant Official Certificates";
const description =
  "Generate, preview, print and download official training certificates with QR verification — all stored locally in your browser.";

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
  component: Home,
});
