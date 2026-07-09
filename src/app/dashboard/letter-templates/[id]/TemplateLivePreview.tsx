'use client';

import { useMemo } from 'react';
import { TemplateStyleConfig } from './types';
import { buildTemplateHtml } from './templateHtmlBuilder';
import { useGetCompanyInfoQuery } from '@/store/api/companySettingsApi';

interface TemplateLivePreviewProps {
  config: TemplateStyleConfig;
}

export default function TemplateLivePreview({ config }: TemplateLivePreviewProps) {
  const { data: companyData } = useGetCompanyInfoQuery();
  const company = companyData?.data;

  const previewHtml = useMemo(() => {
    let html = buildTemplateHtml(config);

    const isModern = config.headerStyle === 'modern';
    const companyLogo = company?.company_logo
      ? isModern
        ? `<img src="${company.company_logo}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 50%;" />`
        : `<img src="${company.company_logo}" alt="Logo" style="height: 50px; margin-right: 15px;" />`
      : isModern
        ? '<div style="width: 100%; height: 100%; background: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #9ca3af;">LOGO</div>'
        : '';

    const sampleData: Record<string, string> = {
      companyName: company?.company_name || 'Kassahun Tsegaye Wood and Alu Works PLC',
      companyLogo,
      companyPhone: company?.company_phone || '+251911670799',
      companyEmail: company?.company_email || 'kassahuntsegayeplc@gmail.com',
      signatoryName: company?.signatory_name || 'Kassahun Tsegaye',
      date: new Date().toLocaleDateString('en-GB'),
      letterNumber: 'PL-2026-0001',
      recipientCompanyName: 'Awash Bank Head Office',
      recipientName: 'Ato Bekele',
      recipientTitle: 'Procurement Division of Head Quarter',
      recipientAddress: 'Addis Ababa, Ethiopia',
      subject: 'Request for Payment for door repairing work at HQ 14th floor',
      body: 'We are writing to formally request payment for the work recently completed at your facility.\n\nThe project was executed as per the agreed specifications and has been completed to the best of our ability, ensuring it meets your satisfaction.',
    };

    Object.entries(sampleData).forEach(([key, value]) => {
      html = html.replaceAll(`{{${key}}}`, value);
    });
    return html;
  }, [config, company]);

  return (
    <div className="rounded-lg border border-border bg-white overflow-hidden">
      <div className="border-b border-border px-4 py-2 bg-surface-hover">
        <p className="text-xs font-medium text-muted">Live Preview</p>
      </div>
      <iframe
        srcDoc={previewHtml}
        sandbox=""
        className="w-full border-0"
        style={{ minHeight: '500px' }}
        title="Template Preview"
      />
    </div>
  );
}
