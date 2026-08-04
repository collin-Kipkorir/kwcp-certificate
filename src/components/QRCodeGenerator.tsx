import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function useQrDataUrl(payload: string, size = 220) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(payload, { margin: 1, width: size, errorCorrectionLevel: "M" })
      .then((d) => {
        if (active) setUrl(d);
      })
      .catch(() => setUrl(""));
    return () => {
      active = false;
    };
  }, [payload, size]);

  return url;
}

export function QRCodeGenerator({ payload, className }: { payload: string; className?: string }) {
  const url = useQrDataUrl(payload);
  if (!url) return <div className={className} />;
  return <img src={url} alt="Certificate verification QR code" className={className} />;
}