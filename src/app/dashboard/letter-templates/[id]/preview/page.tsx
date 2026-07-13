"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetLetterTemplateByIdQuery } from "@/store/api/letterTemplatesApi";
import { useGetCompanyInfoQuery } from "@/store/api/companySettingsApi";
import Button from "@/components/ui/Button";
import { ArrowLeft, Printer } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { buildTemplateHtml } from "../templateHtmlBuilder";
import { TemplateStyleConfig, DEFAULT_STYLE_CONFIG } from "../types";

const DEFAULT_FIELD_VALUES: Record<string, string> = {
  companyName: "Kassahun Tsegaye Wood and Alu Works PLC",
  companyPhone: "+251911670799",
  companyEmail: "kassahuntsegayeplc@gmail.com",
  signatoryName: "Kassahun Tsegaye",
  letterNumber: "",
  recipientCompanyName: "",
  recipientTitle: "",
  recipientAddress: "",
  subject: "",
  body: "",
};

function isStyledTemplate(html: string): boolean {
  return (
    html.includes("{{recipientCompanyName}}") ||
    html.includes("{{subject}}") ||
    html.includes("{{body}}")
  );
}

function detectStyleConfig(html: string): TemplateStyleConfig {
  const config = { ...DEFAULT_STYLE_CONFIG };

  const colorRegex = /(?:background(?:-color)?:\s*)(#[0-9a-fA-F]{3,8})/g;
  const colors = [...html.matchAll(colorRegex)].map((m) => m[1]);
  if (colors.length >= 2) {
    config.header.backgroundColor = colors[0];
    config.header.accentColor = colors[1];
  } else if (colors.length === 1) {
    config.header.backgroundColor = colors[0];
  }

  config.headerStyle = html.includes("rotate(45deg)") ? "modern" : "classic";

  const nameMatch = html.match(/font-size:\s*(\d+)px/);
  if (nameMatch) {
    const px = parseInt(nameMatch[1]);
    config.header.companyNameSize =
      px <= 16 ? "small" : px >= 22 ? "large" : "medium";
  }

  return config;
}

export default function LetterTemplatePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const {
    data: templateData,
    isError: isTemplateError,
    isLoading: isTemplateLoading,
  } = useGetLetterTemplateByIdQuery(params.id as string);

  const {
    data: companyData,
    isError: isCompanyError,
    isLoading: isCompanyLoading,
  } = useGetCompanyInfoQuery();

  const company = companyData?.data;

  useEffect(() => {
    if (isTemplateError || isCompanyError) {
      setLoadError("Failed to load template or company info.");
      setIsLoading(false);
    }
  }, [isTemplateError, isCompanyError]);

  useEffect(() => {
    if (!templateData?.data || !company) return;

    const tpl = templateData.data;
    const html: string = tpl.htmlContent || "";

    const companyLogo = company.company_logo
      ? `<img src="${company.company_logo}" alt="Logo" style="width:100%;height:100%;object-fit:contain;border-radius:50%;" />`
      : '<div style="width:50px;height:50px;background:#f3f4f6;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#9ca3af;">LOGO</div>';

    const replacePlaceholders = (input: string): string => {
      let result = input;
      result = result.replace(/\{\{companyLogo\}\}/g, companyLogo);
      result = result.replace(/\{\{companyName\}\}/g, company.company_name || DEFAULT_FIELD_VALUES.companyName);
      result = result.replace(/\{\{date\}\}/g, new Date().toLocaleDateString("en-GB"));
      result = result.replace(/\{\{recipientCompanyName\}\}/g, tpl.recipientCompanyName || "");
      result = result.replace(/\{\{recipientTitle\}\}/g, tpl.recipientTitle || "");
      result = result.replace(/\{\{recipientAddress\}\}/g, tpl.recipientAddress || "");
      result = result.replace(/\{\{subject\}\}/g, tpl.subject || "");
      result = result.replace(/\{\{body\}\}/g, (tpl.body || "").replace(/\n/g, "<br>"));
      result = result.replace(/\{\{companyPhone\}\}/g, company.company_phone || DEFAULT_FIELD_VALUES.companyPhone);
      result = result.replace(/\{\{companyEmail\}\}/g, company.company_email || DEFAULT_FIELD_VALUES.companyEmail);
      result = result.replace(/\{\{signatoryName\}\}/g, company.signatory_name || DEFAULT_FIELD_VALUES.signatoryName);
      result = result.replace(/\{\{letterNumber\}\}/g, tpl.referenceNumber || "");
      result = result.replace(/\{\{referenceNumber\}\}/g, tpl.referenceNumber || "");
      result = result.replace(/<branch>/gi, "___________________");
      result = result.replace(/<city>/gi, "___________________");
      result = result.replace(/<location>/gi, "___________________");
      result = result.replace(/<price>/gi, "___________________");
      result = result.replace(/<project>/gi, "___________________");
      return result;
    };

    let bodyHtml: string;

    if (isStyledTemplate(html)) {
      const config = detectStyleConfig(html);
      bodyHtml = buildTemplateHtml(config);
    } else {
      bodyHtml = html;
    }

    bodyHtml = replacePlaceholders(bodyHtml);

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
  @page { margin: 0; size: A4; }
  html, body {
    margin: 0;
    padding: 0;
    background: #e9e9ec;
    font-family: Arial, sans-serif;
    color: #333;
  }
  .letter-capture {
    width: 794px;
    min-height: 1123px;
    background: #ffffff;
    margin: 0 auto;
  }
  @media print {
    body { background: #fff; }
    .letter-capture { box-shadow: none; margin: 0; width: 100%; }
  }
</style>
</head>
<body>
  <div class="letter-capture">
    ${bodyHtml}
  </div>
</body>
</html>`;

    setPreviewHtml(fullHtml);
    setIsLoading(false);
  }, [templateData, company]);

  const handlePrint = async () => {
    if (isPrinting) return;
    const iframe = iframeRef.current;
    const iframeDoc = iframe?.contentDocument;
    const captureTarget = iframeDoc?.querySelector(".letter-capture") as HTMLElement | null;
    if (!captureTarget || !iframe?.contentWindow) return;

    setIsPrinting(true);
    try {
      const fontsReady = (iframe.contentWindow.document as any).fonts?.ready;
      if (fontsReady) {
        await fontsReady;
      }
      await new Promise((resolve) => setTimeout(resolve, 150));

      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: 0,
          filename: `${templateData?.data?.name || "letter"}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            backgroundColor: "#ffffff",
            scrollX: 0,
            scrollY: 0,
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(captureTarget)
        .save();
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setIsPrinting(false);
    }
  };

  const stillLoading = isLoading || isTemplateLoading || isCompanyLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/letter-templates")}
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-xl font-bold text-foreground">
            Preview: {templateData?.data?.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handlePrint}
            disabled={!previewHtml || isPrinting}
          >
            <Printer className="h-4 w-4" />{" "}
            {isPrinting ? "Generating..." : "Print"}
          </Button>
        </div>
      </div>

      <div
        className="rounded-lg border border-border bg-white overflow-hidden"
        style={{ height: "calc(100vh - 120px)" }}
      >
        {stillLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-sm text-muted">
              Loading preview...
            </div>
          </div>
        ) : loadError ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-sm text-red-500">{loadError}</div>
          </div>
        ) : previewHtml ? (
          <iframe
            ref={iframeRef}
            srcDoc={previewHtml}
            sandbox="allow-same-origin"
            className="w-full h-full border-0"
            title="Template Preview"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-sm text-muted">
              Failed to load preview
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
