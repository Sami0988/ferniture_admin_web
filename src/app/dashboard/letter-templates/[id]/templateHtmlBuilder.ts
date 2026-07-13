import { TemplateStyleConfig } from "./types";

const FONT_SIZE_MAP = { small: "13px", medium: "15px", large: "17px" };
const NAME_SIZE_MAP = { small: "16px", medium: "20px", large: "26px" };
const LINE_HEIGHT_MAP = { compact: "1.4", normal: "1.6", relaxed: "1.9" };

function buildClassicHeader(config: TemplateStyleConfig): string {
  const { header } = config;
  const bg = header.backgroundColor || "#5c3a1e";
  const accent = header.accentColor || "#f97316";
  const nameSize = NAME_SIZE_MAP[header.companyNameSize] || "20px";

  return `
  <div style="background: linear-gradient(135deg, ${bg} 0%, ${bg}dd 100%); padding: 20px 40px; border-bottom: 4px solid ${accent};">
    <div style="display: flex; align-items: center; gap: 16px;">
      <div style="width: 60px; height: 60px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
        {{companyLogo}}
      </div>
      <div style="flex: 1;">
        <div style="font-size: ${nameSize}; font-weight: bold; color: white; letter-spacing: 0.3px; line-height: 1.25;">{{companyName}}</div>
        <div style="font-size: 11px; margin-top: 5px; color: rgba(255,255,255,0.75); letter-spacing: 0.3px;">
          {{companyPhone}} &nbsp;&middot;&nbsp; {{companyEmail}}
        </div>
      </div>
    </div>
  </div>`;
}

function buildModernHeader(config: TemplateStyleConfig): string {
  const { header } = config;
  const accent = header.accentColor || "#f97316";
  const bg = header.backgroundColor || "#5c3a1e";
  const nameSizeNum = parseInt(NAME_SIZE_MAP[header.companyNameSize]) || 20;
  const fontSize = Math.min(Math.max(Math.round(nameSizeNum * 1.2), 14), 28);

  return `
  <div style="position: relative; height: 110px; margin-bottom: 0; overflow: hidden;">
    <div style="position: absolute; top: 0; left: 0; width: 200px; height: 110px; overflow: hidden;">
      <div style="position: absolute; top: -50px; left: -60px; width: 130px; height: 220px; background: ${bg}; transform: rotate(-20deg);"></div>
      <div style="position: absolute; top: -50px; left: -5px; width: 90px; height: 220px; background: ${accent}; transform: rotate(-20deg);"></div>
      <div style="position: absolute; top: -50px; left: 40px; width: 55px; height: 220px; background: ${bg}; transform: rotate(-20deg);"></div>
    </div>
    <div style="position: absolute; top: 10px; left: 50px; z-index: 2;">
      <div style="width: 80px; height: 80px; background: ${accent}; transform: rotate(45deg); display: flex; align-items: center; justify-content: center; border-radius: 4px;">
        <div style="width: 66px; height: 66px; background: white; border-radius: 50%; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; overflow: hidden;">
          {{companyLogo}}
        </div>
      </div>
    </div>
    <div style="position: absolute; top: 18px; left: 145px; right: 0; height: 70px; z-index: 1;">
      <div style="height: 100%; background: ${accent}; padding: 3px; border-radius: 2px;">
        <div style="height: 100%; background: ${bg}; display: flex; align-items: center; justify-content: center; padding: 0 30px; border-radius: 2px;">
          <span style="font-size: ${fontSize}px; font-weight: bold; color: white; letter-spacing: 0.8px; white-space: normal; overflow: visible; max-width: 100%; display: block; text-align: center; line-height: 1.3;">{{companyName}}</span>
        </div>
      </div>
    </div>
  </div>`;
}

export function buildTemplateHtml(config: TemplateStyleConfig): string {
  const { headerStyle, subject, body, closing, footer } = config;

  const headerHtml =
    headerStyle === "modern"
      ? buildModernHeader(config)
      : buildClassicHeader(config);

  return `
<div style="font-family: 'Georgia', 'Times New Roman', serif; color: #1a1a1a; background: #ffffff;">
  ${headerHtml}

  <div style="padding: 36px 50px 40px 50px;">

    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; padding-bottom: 12px; border-bottom: 1px solid #e5e5e5;">
      <div style="font-size: 12px; color: #666; letter-spacing: 0.3px;">
        <span style="color: #999; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px;">Ref:</span> {{letterNumber}}
      </div>
      <div style="font-size: 13px; color: #444;">
        {{date}}
      </div>
    </div>

    <div style="margin-bottom: 30px; line-height: 1.7; font-size: 14px;">
      <div style="color: #888; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; font-weight: 600;">To</div>
      <div style="font-weight: 600; color: #1a1a1a;">{{recipientCompanyName}}</div>
      <div style="color: #444;">{{recipientTitle}}</div>
      <div style="color: #444;">{{recipientAddress}}</div>
    </div>

    <div style="text-align: ${subject.alignment}; margin: 0 0 28px 0; font-size: 14px; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
      <span style="font-weight: 700; color: #1a1a1a;">Subject:</span>
      <span style="${subject.underline ? "text-decoration: underline; text-underline-offset: 3px;" : ""} color: #333;"> {{subject}}</span>
    </div>

    <div style="font-size: ${FONT_SIZE_MAP[body.fontSize]}; line-height: ${LINE_HEIGHT_MAP[body.lineSpacing]}; color: #333; text-align: justify;">
      {{body}}
    </div>

    <div style="text-align: right; margin-top: 60px; line-height: 1.8; font-size: 14px;">
      <div style="color: #555; margin-bottom: 8px;">${closing.text}</div>
      <div style="margin-top: 40px;">
        <div style="width: 200px; border-top: 1.5px solid #bbb; margin-left: auto; padding-top: 8px;">
          <strong style="color: #1a1a1a; font-size: 14px;">{{signatoryName}}</strong>
        </div>
      </div>
    </div>

  </div>
</div>`.trim();
}
