import { forwardRef, useEffect, useRef, useState } from "react";
import sealImg from "@/assets/seal.png";
import { QRCodeGenerator } from "./QRCodeGenerator";
import { buildQrPayload } from "@/utils/certificate";
import type { AdminSettings } from "@/types/Certificate";

export interface PreviewData {
  id: string;
  name: string;
  certificate: string;
  date: string;
}

interface Props {
  data: PreviewData;
  settings: AdminSettings;
}

const Sheet = forwardRef<HTMLDivElement, Props>(function Sheet({ data, settings }, ref) {
  const name = data.name.trim() || "Applicant Name";
  const training = (data.certificate || "Certificate Title").toUpperCase();

  return (
    <div ref={ref} className="cert-sheet" id="printable-certificate">
      <div className="cert-frame-red" />
      <div className="cert-frame-black" />
      <div className="cert-frame-thin" />
      <img src={settings.watermark || sealImg} alt="" className="cert-watermark" />

      <div className="absolute inset-[54px] flex flex-col items-center px-[60px] pt-[10px] text-center">
        {settings.logo ? (
          <img src={settings.logo} alt="Organization logo" className="h-[74px] object-contain" />
        ) : (
          <img src={sealImg} alt="Organization logo" className="h-[74px] object-contain" />
        )}

        <p className="mt-[6px] text-[34px] leading-tight tracking-[0.06em] uppercase">
          {settings.organization}
        </p>
        <p className="text-[26px] leading-tight tracking-[0.04em] uppercase">{settings.ministry}</p>

        <h1 className="mt-[8px] text-[54px] leading-none tracking-[0.02em] uppercase">
          Certificate of Completion
        </h1>

        <p className="mt-[8px] text-[24px]">This is to certify that</p>

        <p className="mt-[4px] text-[40px] leading-tight font-bold italic tracking-[0.04em]">
          {name}
        </p>
        <div className="cert-rule mt-[2px] w-[740px]" />

        <p className="mt-[12px] text-[23px]">
          has successfully completed the comprehensive training course in
        </p>

        <p className="mt-[6px] text-[38px] leading-tight tracking-[0.01em]">{training}</p>

        <p className="mt-[10px] text-[22px]">Conducted and issued on {data.date}.</p>
        <p className="text-[22px]">at Nairobi Training Center.</p>
      </div>

      {/* Footer row */}
      <div className="absolute right-[70px] bottom-[34px] left-[70px] flex items-end justify-between">
        <div className="w-[280px] text-center">
          <div className="flex h-[70px] items-end justify-center">
            {settings.signature ? (
              <img
                src={settings.signature}
                alt="Authorized signature"
                className="max-h-[70px] object-contain"
              />
            ) : null}
          </div>
          <div className="cert-rule" />
          <p className="mt-[6px] text-[16px]">Authorized Signature</p>
        </div>

        <div className="flex flex-col items-center">
          <img
            src={settings.seal || sealImg}
            alt="Official seal"
            className="h-[104px] w-[104px] object-contain"
          />
          <p className="mt-[4px] text-[14px] tracking-[0.08em]">OFFICIAL SEAL</p>
        </div>

        <div className="w-[280px] text-center">
          <div className="flex justify-center">
            <QRCodeGenerator
              payload={buildQrPayload({
                id: data.id,
                name,
                certificate: data.certificate || "—",
                date: data.date,
              })}
              className="h-[112px] w-[112px]"
            />
          </div>
          <p className="mt-[6px] text-[16px] tracking-[0.06em]">{data.id}</p>
        </div>
      </div>
    </div>
  );
});

export const CertificatePreview = forwardRef<HTMLDivElement, Props>(
  function CertificatePreview(props, ref) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.6);

    useEffect(() => {
      const el = wrapRef.current;
      if (!el) return;
      const update = () => setScale(el.clientWidth / 1123);
      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    return (
      <div ref={wrapRef} className="w-full" style={{ height: 794 * scale }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <Sheet {...props} ref={ref} />
        </div>
      </div>
    );
  },
);