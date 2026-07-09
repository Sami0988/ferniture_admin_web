'use client';

import { TemplateStyleConfig } from './types';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface TemplateStyleFormProps {
  config: TemplateStyleConfig;
  onChange: (config: TemplateStyleConfig) => void;
}

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (val: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">{label}</label>
      <div className="flex gap-1 rounded-lg border border-border p-0.5 bg-surface">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex-1',
              value === opt.value ? 'bg-surface-hover text-foreground' : 'text-muted hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
          checked ? 'bg-brand-gold' : 'bg-border'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}

export default function TemplateStyleForm({ config, onChange }: TemplateStyleFormProps) {
  const update = <K extends keyof TemplateStyleConfig>(
    section: K,
    key: keyof TemplateStyleConfig[K],
    value: unknown
  ) => {
    const sectionValue = config[section];
    onChange({
      ...config,
      [section]: {
        ...(sectionValue as Record<string, unknown>),
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <div className="p-4 space-y-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">Header</p>
          <SegmentedControl
            label="Header Style"
            value={config.headerStyle}
            options={[
              { value: 'modern', label: 'Modern' },
              { value: 'classic', label: 'Classic' },
            ]}
            onChange={(val) => onChange({ ...config, headerStyle: val })}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Background Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={config.header.backgroundColor}
                onChange={(e) => update('header', 'backgroundColor', e.target.value)}
                className="h-8 w-8 rounded border border-border cursor-pointer"
              />
              <span className="text-xs text-muted font-mono">{config.header.backgroundColor}</span>
            </div>
          </div>
          {config.headerStyle === 'modern' && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={config.header.accentColor}
                  onChange={(e) => update('header', 'accentColor', e.target.value)}
                  className="h-8 w-8 rounded border border-border cursor-pointer"
                />
                <span className="text-xs text-muted font-mono">{config.header.accentColor}</span>
              </div>
            </div>
          )}
          {config.headerStyle === 'classic' && (
            <>
              <SegmentedControl
                label="Logo Position"
                value={config.header.logoPosition}
                options={[
                  { value: 'left', label: 'Left' },
                  { value: 'center', label: 'Center' },
                ]}
                onChange={(val) => update('header', 'logoPosition', val)}
              />
            </>
          )}
          <SegmentedControl
            label="Company Name Size"
            value={config.header.companyNameSize}
            options={[
              { value: 'small', label: 'Small' },
              { value: 'medium', label: 'Medium' },
              { value: 'large', label: 'Large' },
            ]}
            onChange={(val) => update('header', 'companyNameSize', val)}
          />
        </div>
      </Card>

      {/* Subject */}
      <Card>
        <div className="p-4 space-y-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">Subject Line</p>
          <SegmentedControl
            label="Alignment"
            value={config.subject.alignment}
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
            ]}
            onChange={(val) => update('subject', 'alignment', val)}
          />
          <Toggle
            label="Underline"
            checked={config.subject.underline}
            onChange={(val) => update('subject', 'underline', val)}
          />
        </div>
      </Card>

      {/* Body */}
      <Card>
        <div className="p-4 space-y-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">Body Text</p>
          <SegmentedControl
            label="Font Size"
            value={config.body.fontSize}
            options={[
              { value: 'small', label: 'Small' },
              { value: 'medium', label: 'Medium' },
              { value: 'large', label: 'Large' },
            ]}
            onChange={(val) => update('body', 'fontSize', val)}
          />
          <SegmentedControl
            label="Line Spacing"
            value={config.body.lineSpacing}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'normal', label: 'Normal' },
              { value: 'relaxed', label: 'Relaxed' },
            ]}
            onChange={(val) => update('body', 'lineSpacing', val)}
          />
        </div>
      </Card>

      {/* Closing */}
      <Card>
        <div className="p-4 space-y-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">Closing</p>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Closing Text</label>
            <input
              type="text"
              className="flex w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand-gold/20 focus:border-brand-gold"
              value={config.closing.text}
              onChange={(e) => update('closing', 'text', e.target.value)}
              placeholder="Thank you for your cooperation."
            />
          </div>
        </div>
      </Card>

      {/* Footer */}
      <Card>
        <div className="p-4 space-y-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">Footer</p>
          <Toggle
            label="Show Phone"
            checked={config.footer.showPhone}
            onChange={(val) => update('footer', 'showPhone', val)}
          />
          <Toggle
            label="Show Email"
            checked={config.footer.showEmail}
            onChange={(val) => update('footer', 'showEmail', val)}
          />
        </div>
      </Card>
    </div>
  );
}
