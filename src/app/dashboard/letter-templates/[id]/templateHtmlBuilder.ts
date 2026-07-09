import { TemplateStyleConfig } from './types';

const FONT_SIZE_MAP = { small: '13px', medium: '15px', large: '17px' };
const NAME_SIZE_MAP = { small: '14px', medium: '18px', large: '24px' };
const LINE_HEIGHT_MAP = { compact: '1.4', normal: '1.6', relaxed: '1.9' };

function buildClassicHeader(config: TemplateStyleConfig): string {
  const { header } = config;
  return `
  <div style="background-color: ${header.backgroundColor}; color: white; padding: 15px 30px; display: flex; align-items: center; justify-content: ${header.logoPosition === 'center' ? 'center' : 'flex-start'};">
    {{companyLogo}}
    <span style="font-size: ${NAME_SIZE_MAP[header.companyNameSize]}; font-weight: bold; letter-spacing: 0.5px;">{{companyName}}</span>
  </div>`;
}

function buildModernHeader(config: TemplateStyleConfig): string {
  const { header } = config;
  const accent = header.accentColor || '#f97316';
  const bg = header.backgroundColor || '#5c3a1e';
  const nameSizeNum = parseInt(NAME_SIZE_MAP[header.companyNameSize]) || 18;
  const fontSize = Math.min(Math.max(Math.round(nameSizeNum * 1.2), 14), 28);

  return `
  <div style="position: relative; height: 110px; margin-bottom: 25px; overflow: visible;">
    <!-- Layer 1: Diagonal striped background -->
    <div style="position: absolute; top: 0; left: 0; width: 220px; height: 130px; overflow: hidden;">
      <div style="position: absolute; top: -30px; left: -40px; width: 140px; height: 180px; background: ${bg}; transform: rotate(-15deg);"></div>
      <div style="position: absolute; top: -30px; left: 10px; width: 100px; height: 180px; background: ${accent}; transform: rotate(-15deg);"></div>
      <div style="position: absolute; top: -30px; left: 50px; width: 60px; height: 180px; background: ${bg}; transform: rotate(-15deg);"></div>
    </div>

    <!-- Layer 2: Diamond-shaped logo badge -->
    <div style="position: absolute; top: 10px; left: 50px; z-index: 2;">
      <div style="width: 80px; height: 80px; background: ${accent}; transform: rotate(45deg); display: flex; align-items: center; justify-content: center; box-shadow: 2px 2px 8px rgba(0,0,0,0.2);">
        <div style="width: 68px; height: 68px; background: white; border-radius: 50%; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; overflow: hidden;">
          {{companyLogo}}
        </div>
      </div>
    </div>

    <!-- Layer 3: Company name banner (parallelogram) -->
    <div style="position: absolute; top: 20px; left: 130px; right: 20px; height: 70px; z-index: 1;">
      <!-- Orange border layer -->
      <div style="position: absolute; inset: 0; background: ${accent}; clip-path: polygon(5% 0, 100% 0, 95% 100%, 0 100%);"></div>
      <!-- Brown inner layer -->
      <div style="position: absolute; inset: 3px; background: ${bg}; clip-path: polygon(5% 0, 100% 0, 95% 100%, 0 100%); display: flex; align-items: center; justify-content: center; padding: 0 40px;">
        <span style="font-size: ${fontSize}px; font-weight: bold; color: white; letter-spacing: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; display: block; text-align: center;">{{companyName}}</span>
      </div>
    </div>
  </div>`;
}

export function buildTemplateHtml(config: TemplateStyleConfig): string {
  const { headerStyle, subject, body, closing, footer } = config;

  const headerHtml = headerStyle === 'modern' ? buildModernHeader(config) : buildClassicHeader(config);

  return `
<div style="padding: 40px; font-family: Arial, sans-serif; color: #333;">
  ${headerHtml}

  <div style="text-align: right; margin: 20px 0; font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
    Date: {{date}}
  </div>

  <div style="margin-bottom: 30px; line-height: 1.6;">
    To<br>
    {{recipientCompanyName}}<br>
    {{recipientTitle}}<br>
    {{recipientAddress}}
  </div>

  <div style="text-align: ${subject.alignment}; margin: 30px 0; font-size: 14px;">
    Subject: <span style="${subject.underline ? 'text-decoration: underline;' : ''}">{{subject}}</span>
  </div>

  <div style="font-size: ${FONT_SIZE_MAP[body.fontSize]}; line-height: ${LINE_HEIGHT_MAP[body.lineSpacing]};">
    {{body}}
  </div>

  <div style="text-align: right; margin-top: 60px; line-height: 1.8;">
    ${closing.text}<br><br>
    Yours sincerely,<br>
    <strong>{{signatoryName}}</strong>
  </div>

  <div style="border-top: 1px solid #ccc; margin-top: 40px; font-size: 11px; display: flex; justify-content: space-between;">
    ${footer.showPhone ? '<span>Phone: {{companyPhone}}</span>' : '<span></span>'}
    ${footer.showEmail ? '<span>Email: {{companyEmail}}</span>' : ''}
  </div>
</div>`.trim();
}
