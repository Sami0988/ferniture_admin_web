'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';

interface TemplateField {
  key: string;
  label: string;
  placeholder: string;
  defaultValue: string;
  type?: 'text' | 'textarea';
}

const TEMPLATE_FIELDS: TemplateField[] = [
  { key: 'companyName', label: 'Company Name', placeholder: 'e.g. Kassahun Tsegaye Wood and Alu Works PLC', defaultValue: 'Kassahun Tsegaye Wood and Alu Works PLC' },
  { key: 'companyPhone', label: 'Company Phone', placeholder: 'e.g. +251911670799', defaultValue: '+251911670799' },
  { key: 'companyEmail', label: 'Company Email', placeholder: 'e.g. info@company.com', defaultValue: 'kassahuntsegayeplc@gmail.com' },
  { key: 'signatoryName', label: 'Signatory Name', placeholder: 'e.g. Kassahun Tsegaye', defaultValue: 'Kassahun Tsegaye' },
  { key: 'recipientCompanyName', label: 'Recipient Company', placeholder: 'e.g. Awash Bank', defaultValue: 'Awash Bank Head Office' },
  { key: 'recipientTitle', label: 'Recipient Title/Dept', placeholder: 'e.g. Procurement Manager', defaultValue: 'Procurement Division of Head Quarter' },
  { key: 'recipientAddress', label: 'Recipient Address', placeholder: 'e.g. Addis Ababa, Ethiopia', defaultValue: 'Addis Ababa, Ethiopia' },
  { key: 'subject', label: 'Subject Line', placeholder: 'e.g. Request for Payment', defaultValue: 'Request for Payment for door repairing work at HQ 14th floor' },
  { key: 'body', label: 'Body Content', placeholder: 'Write your letter content here...', defaultValue: 'We are writing to formally request payment for the work recently completed at your facility.\n\nThe project was executed as per the agreed specifications and has been completed to the best of our ability, ensuring it meets your satisfaction.', type: 'textarea' },
  { key: 'closingText', label: 'Closing Text', placeholder: 'e.g. Thank you for your cooperation.', defaultValue: 'Thank you for your cooperation.' },
];

interface CustomHtmlEditorProps {
  fieldValues: Record<string, string>;
  onFieldValuesChange: (values: Record<string, string>) => void;
  headerBackgroundColor: string;
  onHeaderBackgroundColorChange: (color: string) => void;
  headerAccentColor: string;
  onHeaderAccentColorChange: (color: string) => void;
  companyNameFontSize: string;
  onCompanyNameFontSizeChange: (size: string) => void;
  bodyFontSize: string;
  onBodyFontSizeChange: (size: string) => void;
  showPhoneInFooter: boolean;
  onShowPhoneInFooterChange: (show: boolean) => void;
  showEmailInFooter: boolean;
  onShowEmailInFooterChange: (show: boolean) => void;
}

export default function CustomHtmlEditor({
  fieldValues,
  onFieldValuesChange,
  headerBackgroundColor,
  onHeaderBackgroundColorChange,
  headerAccentColor,
  onHeaderAccentColorChange,
  companyNameFontSize,
  onCompanyNameFontSizeChange,
  bodyFontSize,
  onBodyFontSizeChange,
  showPhoneInFooter,
  onShowPhoneInFooterChange,
  showEmailInFooter,
  onShowEmailInFooterChange,
}: CustomHtmlEditorProps) {
  const [activeTab, setActiveTab] = useState<'fields' | 'style'>('fields');

  const updateField = (key: string, value: string) => {
    onFieldValuesChange({ ...fieldValues, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface">
        <button
          onClick={() => setActiveTab('fields')}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === 'fields' ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground'
          }`}
        >
          Letter Content
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === 'style' ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground'
          }`}
        >
          Style & Colors
        </button>
      </div>

      {activeTab === 'fields' ? (
        /* Letter Content Fields */
        <Card>
          <div className="p-4 space-y-4">
            <p className="text-xs font-medium text-muted uppercase tracking-wide">Letter Content</p>
            <p className="text-xs text-muted">Fill in each field. The system will generate the template automatically.</p>
            
            {TEMPLATE_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold min-h-[120px] resize-y"
                    value={fieldValues[field.key] || field.defaultValue}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                  />
                ) : (
                  <input
                    type="text"
                    className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                    value={fieldValues[field.key] || field.defaultValue}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>
      ) : (
        /* Style Controls */
        <Card>
          <div className="p-4 space-y-4">
            <p className="text-xs font-medium text-muted uppercase tracking-wide">Style & Colors</p>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Header Background Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={headerBackgroundColor}
                  onChange={(e) => onHeaderBackgroundColorChange(e.target.value)}
                  className="h-8 w-8 rounded border border-border cursor-pointer"
                />
                <span className="text-xs text-muted font-mono">{headerBackgroundColor}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Header Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={headerAccentColor}
                  onChange={(e) => onHeaderAccentColorChange(e.target.value)}
                  className="h-8 w-8 rounded border border-border cursor-pointer"
                />
                <span className="text-xs text-muted font-mono">{headerAccentColor}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Company Name Size</label>
              <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface">
                {['small', 'medium', 'large'].map((size) => (
                  <button
                    key={size}
                    onClick={() => onCompanyNameFontSizeChange(size)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                      companyNameFontSize === size ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Body Text Size</label>
              <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface">
                {['small', 'medium', 'large'].map((size) => (
                  <button
                    key={size}
                    onClick={() => onBodyFontSizeChange(size)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                      bodyFontSize === size ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Footer</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPhoneInFooter}
                  onChange={(e) => onShowPhoneInFooterChange(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm text-foreground">Show phone in footer</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showEmailInFooter}
                  onChange={(e) => onShowEmailInFooterChange(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm text-foreground">Show email in footer</span>
              </label>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Helper to generate HTML from field values and style settings
export function generateTemplateHtml(
  fieldValues: Record<string, string>,
  defaults: Record<string, string>,
  styles: {
    headerBackgroundColor: string;
    headerAccentColor: string;
    companyNameFontSize: string;
    bodyFontSize: string;
    showPhoneInFooter: boolean;
    showEmailInFooter: boolean;
  }
): string {
  const get = (key: string) => fieldValues[key] || defaults[key] || '';
  
  const NAME_SIZE_MAP: Record<string, string> = { small: '16px', medium: '20px', large: '26px' };
  const BODY_SIZE_MAP: Record<string, string> = { small: '13px', medium: '15px', large: '17px' };
  
  const nameSize = NAME_SIZE_MAP[styles.companyNameFontSize] || '20px';
  const bodySize = BODY_SIZE_MAP[styles.bodyFontSize] || '15px';
  const accent = styles.headerAccentColor;
  const bg = styles.headerBackgroundColor;
  
  const bodyContent = get('body').replace(/\n/g, '<br>');

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 40px; color: #333; }
  </style>
</head>
<body>
  <div style="position: relative; height: 110px; margin-bottom: 25px; overflow: visible;">
    <div style="position: absolute; top: 0; left: 0; width: 220px; height: 130px; overflow: hidden;">
      <div style="position: absolute; top: -30px; left: -40px; width: 140px; height: 180px; background: ${bg}; transform: rotate(-15deg);"></div>
      <div style="position: absolute; top: -30px; left: 10px; width: 100px; height: 180px; background: ${accent}; transform: rotate(-15deg);"></div>
      <div style="position: absolute; top: -30px; left: 50px; width: 60px; height: 180px; background: ${bg}; transform: rotate(-15deg);"></div>
    </div>
    <div style="position: absolute; top: 10px; left: 50px; z-index: 2;">
      <div style="width: 80px; height: 80px; background: ${accent}; transform: rotate(45deg); display: flex; align-items: center; justify-content: center; box-shadow: 2px 2px 8px rgba(0,0,0,0.2);">
        <div style="width: 68px; height: 68px; background: white; border-radius: 50%; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; overflow: hidden;">
          {{companyLogo}}
        </div>
      </div>
    </div>
    <div style="position: absolute; top: 20px; left: 130px; right: 20px; height: 70px; z-index: 1;">
      <div style="position: absolute; inset: 0; background: ${accent}; clip-path: polygon(5% 0, 100% 0, 95% 100%, 0 100%);"></div>
      <div style="position: absolute; inset: 3px; background: ${bg}; clip-path: polygon(5% 0, 100% 0, 95% 100%, 0 100%); display: flex; align-items: center; justify-content: center; padding: 0 40px;">
        <span style="font-size: ${nameSize}; font-weight: bold; color: white; letter-spacing: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; display: block; text-align: center;">{{companyName}}</span>
      </div>
    </div>
  </div>

  <div style="text-align: right; margin: 20px 0; font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
    Date: {{date}}
  </div>

  <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px;">
    <div>Reference: {{referenceNumber}}</div>
    <div>Due Date: {{dueDate}}</div>
  </div>

  <div style="margin-bottom: 30px; line-height: 1.6;">
    To<br>
    {{recipientCompanyName}}<br>
    {{recipientTitle}}<br>
    {{recipientAddress}}
  </div>

  <div style="text-align: center; margin: 30px 0; font-size: 14px;">
    Subject: <span style="text-decoration: underline;">{{subject}}</span>
  </div>

  <div style="font-size: ${bodySize}; line-height: 1.6;">
    {{body}}
  </div>

  <div style="text-align: right; margin-top: 60px; line-height: 1.8;">
    {{closingText}}<br><br>
    Yours sincerely,<br>
    <strong>{{signatoryName}}</strong>
  </div>

  <div style="border-top: 1px solid #ccc; margin-top: 40px; font-size: 11px; display: flex; justify-content: space-between;">
    ${styles.showPhoneInFooter ? `<span>Phone: {{companyPhone}}</span>` : '<span></span>'}
    ${styles.showEmailInFooter ? `<span>Email: {{companyEmail}}</span>` : ''}
  </div>
</body>
</html>`.trim();
}
