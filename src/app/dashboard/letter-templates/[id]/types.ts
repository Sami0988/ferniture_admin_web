export interface TemplateStyleConfig {
  mode: 'styled' | 'custom';
  headerStyle: 'classic' | 'modern';
  header: {
    backgroundColor: string;
    accentColor: string;
    logoPosition: 'left' | 'center';
    companyNameSize: 'small' | 'medium' | 'large';
  };
  subject: {
    alignment: 'left' | 'center';
    underline: boolean;
  };
  body: {
    fontSize: 'small' | 'medium' | 'large';
    lineSpacing: 'compact' | 'normal' | 'relaxed';
  };
  closing: {
    text: string;
  };
  footer: {
    showPhone: boolean;
    showEmail: boolean;
  };
}

export const DEFAULT_STYLE_CONFIG: TemplateStyleConfig = {
  mode: 'styled',
  headerStyle: 'modern',
  header: { backgroundColor: '#5c3a1e', accentColor: '#f97316', logoPosition: 'left', companyNameSize: 'medium' },
  subject: { alignment: 'center', underline: true },
  body: { fontSize: 'medium', lineSpacing: 'normal' },
  closing: { text: 'Thank you for your cooperation.' },
  footer: { showPhone: true, showEmail: true },
};

export const PLACEHOLDER_HELPERS = [
  { placeholder: '{{companyName}}', description: 'Company name' },
  { placeholder: '{{companyLogo}}', description: 'Logo image tag' },
  { placeholder: '{{companyPhone}}', description: 'Company phone' },
  { placeholder: '{{companyEmail}}', description: 'Company email' },
  { placeholder: '{{signatoryName}}', description: 'Signatory name' },
  { placeholder: '{{date}}', description: 'Letter date' },
  { placeholder: '{{letterNumber}}', description: 'Letter number' },
  { placeholder: '{{recipientCompanyName}}', description: 'Recipient company' },
  { placeholder: '{{recipientName}}', description: 'Recipient name' },
  { placeholder: '{{recipientTitle}}', description: 'Recipient title/position' },
  { placeholder: '{{recipientAddress}}', description: 'Recipient address' },
  { placeholder: '{{subject}}', description: 'Letter subject' },
  { placeholder: '{{body}}', description: 'Letter body content' },
];
