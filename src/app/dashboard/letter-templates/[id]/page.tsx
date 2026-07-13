'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  useGetLetterTemplateByIdQuery,
  useCreateLetterTemplateMutation,
  useUpdateLetterTemplateMutation,
} from '@/store/api/letterTemplatesApi';
import { useGetCompanyInfoQuery } from '@/store/api/companySettingsApi';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ArrowLeft, Save, FileText, Code, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { TemplateStyleConfig, DEFAULT_STYLE_CONFIG } from './types';
import { buildTemplateHtml } from './templateHtmlBuilder';
import TemplateStyleForm from './TemplateStyleForm';
import TemplateLivePreview from './TemplateLivePreview';
import CustomHtmlEditor, { generateTemplateHtml } from './CustomHtmlEditor';
import { cn } from '@/lib/utils';

const DEFAULT_FIELD_VALUES: Record<string, string> = {
  companyName: 'Kassahun Tsegaye Wood and Alu Works PLC',
  companyPhone: '+251911670799',
  companyEmail: 'kassahuntsegayeplc@gmail.com',
  signatoryName: 'Kassahun Tsegaye',
  letterNumber: '',
  recipientCompanyName: '',
  recipientTitle: '',
  recipientAddress: '',
  subject: '',
  body: '',
};

export default function LetterTemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';

  const { data: templateData, isLoading: isLoadingTemplate } = useGetLetterTemplateByIdQuery(
    params.id as string,
    { skip: isNew }
  );
  const { data: companyData } = useGetCompanyInfoQuery();
  const company = companyData?.data;
  const [createTemplate, { isLoading: isCreating }] = useCreateLetterTemplateMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateLetterTemplateMutation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'styled' | 'custom'>('styled');
  const [styleConfig, setStyleConfig] = useState<TemplateStyleConfig>(DEFAULT_STYLE_CONFIG);
  
  // Custom template fields
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(DEFAULT_FIELD_VALUES);
  const [headerBgColor, setHeaderBgColor] = useState('#5c3a1e');
  const [headerAccentColor, setHeaderAccentColor] = useState('#f97316');
  const [companyNameFontSize, setCompanyNameFontSize] = useState('medium');
  const [bodyFontSize, setBodyFontSize] = useState('medium');
  const [showPhoneInFooter, setShowPhoneInFooter] = useState(true);
  const [showEmailInFooter, setShowEmailInFooter] = useState(true);

  useEffect(() => {
    if (templateData?.data) {
      const tpl = templateData.data;
      setName(tpl.name);
      setDescription(tpl.description || '');
      // Load template fields if they exist
      if (tpl.recipientCompanyName || tpl.recipientTitle || tpl.recipientAddress || tpl.subject || tpl.body || tpl.referenceNumber) {
        setFieldValues(prev => ({
          ...prev,
          recipientCompanyName: tpl.recipientCompanyName || prev.recipientCompanyName,
          recipientTitle: tpl.recipientTitle || prev.recipientTitle,
          recipientAddress: tpl.recipientAddress || prev.recipientAddress,
          subject: tpl.subject || prev.subject,
          body: tpl.body || prev.body,
          letterNumber: tpl.referenceNumber || prev.letterNumber,
        }));
      }
      // Detect if it's a custom HTML or styled template based on content
      if (tpl.htmlContent) {
        // If it has unfilled placeholders, it's a styled template
        // If placeholders are replaced with actual values, it's a custom template
        const hasPlaceholders = tpl.htmlContent.includes('{{recipientCompanyName}}') || 
                               tpl.htmlContent.includes('{{subject}}') ||
                               tpl.htmlContent.includes('{{body}}');
        if (hasPlaceholders) {
          setMode('styled');
        } else {
          setMode('custom');
          // Extract field values from the HTML
          extractFieldValuesFromHtml(tpl.htmlContent);
        }
      }
    }
  }, [templateData]);

  const extractFieldValuesFromHtml = (html: string) => {
    const newFieldValues = { ...DEFAULT_FIELD_VALUES };
    
    // Extract recipient info - pattern: To<br />Company<br />Title<br />Address
    const toMatch = html.match(/To<br\s*\/?>\s*([^<\n]+)<br\s*\/?>\s*([^<\n]+)<br\s*\/?>\s*([^<\n]+)/i);
    if (toMatch) {
      newFieldValues.recipientCompanyName = toMatch[1].trim();
      newFieldValues.recipientTitle = toMatch[2].trim();
      newFieldValues.recipientAddress = toMatch[3].trim();
    }
    
    // Extract subject - pattern: Subject: <span...>text</span> or Subject: text
    const subjectMatch = html.match(/Subject:\s*(?:<[^>]+>)*([^<]+)/i);
    if (subjectMatch) {
      newFieldValues.subject = subjectMatch[1].trim();
    }
    
    // Extract body - content between subject div and closing div
    const bodyMatch = html.match(/font-size:\d+px;line-height:[^"]*">\s*([\s\S]*?)\s*<\/div>\s*<div[^>]*>\s*<div[^>]*>\s*(?:Thank|Yours)/i);
    if (bodyMatch) {
      const body = bodyMatch[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
      if (body) newFieldValues.body = body;
    }
    
    // Extract closing - text before "Yours sincerely"
    const closingMatch = html.match(/(?:margin-top:\d+px[^"]*">)\s*([^<]+)<br\s*\/?>\s*<br\s*\/?>\s*Yours sincerely/i);
    if (closingMatch) {
      const text = closingMatch[1].trim();
      // Only use if it looks like closing text (not a placeholder or HTML)
      if (text && !text.includes('{{') && !text.includes('div') && !text.includes('style')) {
        newFieldValues.closingText = text;
      }
    }
    
    setFieldValues(newFieldValues);
  };

  const getHtmlContent = () => {
    if (mode === 'styled') {
      return buildTemplateHtml(styleConfig);
    }
    return generateTemplateHtml(fieldValues, DEFAULT_FIELD_VALUES, {
      headerBackgroundColor: headerBgColor,
      headerAccentColor,
      companyNameFontSize,
      bodyFontSize,
      showPhoneInFooter,
      showEmailInFooter,
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Template name is required');
      return;
    }
    const htmlContent = getHtmlContent();
    try {
      const templateData = {
        name,
        description: description || undefined,
        htmlContent,
        recipientCompanyName: fieldValues.recipientCompanyName || undefined,
        recipientTitle: fieldValues.recipientTitle || undefined,
        recipientAddress: fieldValues.recipientAddress || undefined,
        subject: fieldValues.subject || undefined,
        body: fieldValues.body || undefined,
        referenceNumber: fieldValues.letterNumber || undefined,
        dueDate: undefined,
      };
      if (isNew) {
        await createTemplate(templateData).unwrap();
        toast.success('Template created');
      } else {
        await updateTemplate({ id: params.id as string, data: templateData }).unwrap();
        toast.success('Template updated');
      }
      router.push('/dashboard/letter-templates');
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to save template';
      toast.error(message);
    }
  };

  const handlePreviewPdf = () => {
    if (isNew) {
      toast.error('Save the template first before previewing');
      return;
    }
    router.push(`/dashboard/letter-templates/${params.id}/preview`);
  };

  // Generate preview HTML for custom mode
  const getCustomPreviewHtml = () => {
    const html = getHtmlContent();
    // Use actual company logo from API or placeholder
    const companyLogo = company?.company_logo
      ? `<img src="${company.company_logo}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 50%;" />`
      : '<div style="width: 50px; height: 50px; background: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #9ca3af;">LOGO</div>';
    
    let preview = html;
    preview = preview.replace('{{companyLogo}}', companyLogo);
    preview = preview.replace('{{companyName}}', fieldValues.companyName || DEFAULT_FIELD_VALUES.companyName);
    preview = preview.replace('{{companyPhone}}', fieldValues.companyPhone || DEFAULT_FIELD_VALUES.companyPhone);
    preview = preview.replace('{{companyEmail}}', fieldValues.companyEmail || DEFAULT_FIELD_VALUES.companyEmail);
    preview = preview.replace('{{signatoryName}}', fieldValues.signatoryName || DEFAULT_FIELD_VALUES.signatoryName);
    preview = preview.replace('{{date}}', new Date().toLocaleDateString('en-GB'));
    preview = preview.replace('{{letterNumber}}', fieldValues.letterNumber || '');
    preview = preview.replace('{{recipientCompanyName}}', fieldValues.recipientCompanyName || '');
    preview = preview.replace('{{recipientTitle}}', fieldValues.recipientTitle || '');
    preview = preview.replace('{{recipientAddress}}', fieldValues.recipientAddress || '');
    preview = preview.replace('{{subject}}', fieldValues.subject || '');
    preview = preview.replace('{{body}}', (fieldValues.body || '').replace(/\n/g, '<br>'));
    preview = preview.replace(/<branch>/gi, '___________________');
    preview = preview.replace(/<city>/gi, '___________________');
    preview = preview.replace(/<location>/gi, '___________________');
    preview = preview.replace(/<price>/gi, '___________________');
    preview = preview.replace(/<project>/gi, '___________________');
    
    return preview;
  };

  if (!isNew && isLoadingTemplate) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-surface-hover rounded animate-pulse" />
        <div className="h-64 bg-surface-hover rounded animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard/letter-templates')} className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Templates
          </button>
          <h1 className="text-xl font-bold text-foreground">{isNew ? 'New Template' : 'Edit Template'}</h1>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button variant="secondary" onClick={handlePreviewPdf}>
              <FileText className="h-4 w-4" /> Preview PDF
            </Button>
          )}
          <Button onClick={handleSave} loading={isCreating || isUpdating}>
            <Save className="h-4 w-4" /> Save
          </Button>
        </div>
      </div>

      {/* Mode Toggle - only show for new templates */}
      {isNew && (
        <div className="flex gap-2">
          <button
            onClick={() => setMode('styled')}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              mode === 'styled'
                ? 'bg-brand-gold text-white'
                : 'bg-surface-hover text-muted hover:text-foreground'
            )}
          >
            <Palette className="h-4 w-4" /> Styled Template
          </button>
          <button
            onClick={() => setMode('custom')}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              mode === 'custom'
                ? 'bg-brand-gold text-white'
                : 'bg-surface-hover text-muted hover:text-foreground'
            )}
          >
            <Code className="h-4 w-4" /> Custom Template
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Meta + Controls */}
        <div className="space-y-4">
          <Card>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">Template Name *</label>
                <input
                  type="text"
                  className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Awash Bank Payment Letter"
                  maxLength={255}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">Description</label>
                <input
                  type="text"
                  className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description"
                  maxLength={500}
                />
              </div>
            </div>
          </Card>

          {mode === 'styled' ? (
            <TemplateStyleForm config={styleConfig} onChange={setStyleConfig} />
          ) : (
            <CustomHtmlEditor
              fieldValues={fieldValues}
              onFieldValuesChange={setFieldValues}
              headerBackgroundColor={headerBgColor}
              onHeaderBackgroundColorChange={setHeaderBgColor}
              headerAccentColor={headerAccentColor}
              onHeaderAccentColorChange={setHeaderAccentColor}
              companyNameFontSize={companyNameFontSize}
              onCompanyNameFontSizeChange={setCompanyNameFontSize}
              bodyFontSize={bodyFontSize}
              onBodyFontSizeChange={setBodyFontSize}
              showPhoneInFooter={showPhoneInFooter}
              onShowPhoneInFooterChange={setShowPhoneInFooter}
              showEmailInFooter={showEmailInFooter}
              onShowEmailInFooterChange={setShowEmailInFooter}
            />
          )}
        </div>

        {/* Right: Live Preview */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          {mode === 'styled' ? (
            <TemplateLivePreview config={styleConfig} fieldValues={fieldValues} />
          ) : (
            <div className="rounded-lg border border-border bg-white overflow-hidden">
              <div className="border-b border-border px-4 py-2 bg-surface-hover">
                <p className="text-xs font-medium text-muted">Live Preview</p>
              </div>
              <iframe
                srcDoc={getCustomPreviewHtml()}
                sandbox=""
                className="w-full border-0"
                style={{ minHeight: '500px' }}
                title="Template Preview"
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
