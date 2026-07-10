'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetLetterTemplateByIdQuery } from '@/store/api/letterTemplatesApi';
import { useGetCompanyInfoQuery } from '@/store/api/companySettingsApi';
import Button from '@/components/ui/Button';
import { ArrowLeft, Printer } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

export default function LetterTemplatePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data: templateData } = useGetLetterTemplateByIdQuery(params.id as string);
  const { data: companyData } = useGetCompanyInfoQuery();

  const company = companyData?.data;

  useEffect(() => {
    if (!templateData?.data || !company) return;

    const tpl = templateData.data;
    const html = tpl.htmlContent;
    const sampleData: Record<string, string> = {
      companyLogo: company.company_logo
        ? `<img src="${company.company_logo}" alt="Logo" style="width:100%;height:100%;object-fit:contain;border-radius:50%;" />`
        : '<div style="width:50px;height:50px;background:#f3f4f6;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#9ca3af;">LOGO</div>',
      companyName: company.company_name || 'Kassahun Tsegaye Wood and Alu Works PLC',
      companyPhone: company.company_phone || '+251911670799',
      companyEmail: company.company_email || 'kassahuntsegayeplc@gmail.com',
      signatoryName: company.signatory_name || 'Kassahun Tsegaye',
      date: new Date().toLocaleDateString('en-GB'),
      letterNumber: tpl.referenceNumber || 'PL-2026-0001',
      referenceNumber: tpl.referenceNumber || 'AWS/PROC/2026/001',
      dueDate: tpl.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }),
      recipientCompanyName: tpl.recipientCompanyName || 'Sample Recipient Company',
      recipientName: '',
      recipientTitle: tpl.recipientTitle || 'Procurement Department',
      recipientAddress: tpl.recipientAddress || 'Addis Ababa, Ethiopia',
      subject: tpl.subject || 'Request for Payment',
      body: (tpl.body || 'We are writing to formally request payment for the work recently completed.').replace(/\n/g, '<br>'),
      closingText: 'Thank you for your cooperation.',
    };

    let preview = html;
    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replaceAll(`{{${key}}}`, value);
    });
    setPreviewHtml(preview);
    setIsLoading(false);
  }, [templateData, company]);

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.print();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/letter-templates')}
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h1 className="text-xl font-bold text-foreground">
            Preview: {templateData?.data?.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-sm text-muted">Loading preview...</div>
          </div>
        ) : previewHtml ? (
          <iframe
            ref={iframeRef}
            srcDoc={previewHtml}
            sandbox=""
            className="w-full h-full border-0"
            title="Template Preview"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-sm text-muted">Failed to load preview</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
