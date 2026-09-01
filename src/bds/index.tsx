import { ReactNode, CSSProperties, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import './bds.css';

/* Higher-fidelity BDS primitives matching @buildertrend/components APIs.
   These are mimics (no real lib installed), but the API surface and visual
   styling are aligned with the actual Blueprint components so the page
   structure mirrors what a real-BDS implementation would look like. */

type ButtonDisplay = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'brandprimary' | 'brandsecondary' | 'secondarydanger';

export function BdsButton({
  text, icon, iconRight, displayType = 'primary', disabled, loading, onClick, className = '', style, type = 'button', selected, ariaLabel,
}: {
  text?: ReactNode;
  icon?: ReactNode;
  iconRight?: ReactNode;
  displayType?: ButtonDisplay;
  disabled?: boolean;
  loading?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  style?: CSSProperties;
  type?: 'button' | 'submit' | 'reset';
  selected?: boolean;
  ariaLabel?: string;
}) {
  const iconOnly = !text && (icon || iconRight);
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-pressed={selected}
      onClick={onClick}
      style={style}
      className={`bds-r-button bds-r-button-${displayType} ${selected ? 'bds-r-button--selected' : ''} ${iconOnly ? 'bds-r-button--icon-only' : ''} ${loading ? 'bds-r-button--loading' : ''} ${className}`}
    >
      <span className="bds-r-button--content">
        {icon && <span className="bds-r-button--icon">{icon}</span>}
        {text && <span className="bds-r-button--text">{text}</span>}
        {iconRight && <span className="bds-r-button--icon">{iconRight}</span>}
      </span>
    </button>
  );
}

type BadgeDisplay = 'default' | 'info' | 'warning' | 'danger' | 'success';
export function BdsBadge({ text, displayType = 'default', icon, textOnly, ariaLabel }: {
  text?: string; displayType?: BadgeDisplay; icon?: ReactNode; textOnly?: boolean; ariaLabel?: string;
}) {
  return (
    <span aria-label={ariaLabel} className={`bds-r-badge bds-r-badge-${displayType} ${textOnly ? 'bds-r-badge--text-only' : ''}`}>
      {!textOnly && icon && <span className="bds-r-badge--icon">{icon}</span>}
      {text && <span className="bds-r-badge--text">{text}</span>}
    </span>
  );
}

export function BdsPill({ text, displayType = 'default', selected, onClick, icon }: {
  text: string; displayType?: 'default' | 'info' | 'success' | 'warning' | 'danger';
  selected?: boolean; onClick?: () => void; icon?: ReactNode;
}) {
  const Tag: any = onClick ? 'button' : 'span';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`bds-r-pill bds-r-pill-${displayType} ${selected ? 'bds-r-pill--selected' : ''} ${onClick ? 'bds-r-pill--clickable' : ''}`}
    >
      {icon && <span className="bds-r-pill--icon">{icon}</span>}
      {text}
    </Tag>
  );
}

type TextSize = 'normal-sm' | 'normal-md' | 'normal-lg' | 'distinct-sm' | 'distinct-md' | 'distinct-lg' | 'heavy-sm' | 'heavy-md' | 'heavy-lg';
export function BdsText({ size = 'normal-md', children, as, className = '', style, id }: {
  size?: TextSize; children: ReactNode; as?: keyof JSX.IntrinsicElements; className?: string; style?: CSSProperties;
  /** For headings referenced by aria-labelledby. */
  id?: string;
}) {
  const Tag: any = as ?? 'span';
  return <Tag id={id} className={`bds-r-text bds-r-text-${size} ${className}`} style={style}>{children}</Tag>;
}

export function BdsInput({ id, value, onChange, placeholder, disabled, readOnly, className = '', style, ...rest }: {
  id: string;
  value?: string | number;
  onChange?: (id: string, value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  style?: CSSProperties;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'value' | 'onChange' | 'className' | 'style' | 'disabled' | 'readOnly'>) {
  return (
    <input
      id={id}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      onChange={(e) => onChange?.(id, e.target.value)}
      className={`bds-r-input ${className}`}
      style={style}
      {...rest}
    />
  );
}

export function BdsTextArea({ id, value, onChange, placeholder, disabled, rows = 3, className = '', style, ...rest }: {
  id: string;
  value?: string;
  onChange?: (id: string, value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  className?: string;
  style?: CSSProperties;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'value' | 'onChange' | 'className' | 'style' | 'disabled' | 'rows'>) {
  return (
    <textarea
      id={id}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      onChange={(e) => onChange?.(id, e.target.value)}
      className={`bds-r-textarea ${className}`}
      style={style}
      {...rest}
    />
  );
}

/* ───────────── BdsAlert ─────────────
   Prototype shim of the real BTAlert (Storybook: common-components-btalert).
   API mirrors the stories' props (type, message, title, showIcon, banner,
   closable, closeText). Productionize by importing BTAlert from clients-app
   and deleting this. Hand-rolling a styled div instead of using this is what
   this component exists to prevent. */
export function BdsAlert({ type = 'default', message, title, showIcon, style }: {
  type?: 'default' | 'info' | 'success' | 'warning' | 'error';
  message: ReactNode;
  title?: ReactNode;
  showIcon?: boolean;
  style?: CSSProperties;
}) {
  const palette: Record<string, { bg: string; fg: string; border: string }> = {
    default: { bg: 'var(--bds-color-gray-10)', fg: 'var(--bds-color-gray-90)', border: 'var(--bds-color-gray-15)' },
    info: { bg: 'var(--bds-color-blue-10)', fg: 'var(--bds-color-blue-80)', border: 'var(--bds-color-blue-10)' },
    success: { bg: 'var(--bds-color-green-10)', fg: 'var(--bds-color-green-80)', border: 'var(--bds-color-green-10)' },
    warning: { bg: 'var(--bds-color-warning-background)', fg: 'var(--bds-color-warning-foreground)', border: 'var(--bds-color-yellow-15)' },
    error: { bg: 'var(--bds-color-red-10, #FDECEC)', fg: 'var(--bds-color-red-80, #8A1C1C)', border: 'var(--bds-color-red-10, #FDECEC)' },
  };
  const c = palette[type] ?? palette.default;
  return (
    <div
      role="alert"
      style={{
        background: c.bg, color: c.fg, border: `1px solid ${c.border}`,
        borderRadius: 'var(--bds-radius-md, 6px)', padding: '12px 14px',
        fontSize: 14, lineHeight: 1.5, display: 'flex', gap: 10,
        alignItems: 'flex-start', ...style,
      }}
    >
      {showIcon && (
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
      <div>
        {title && <div style={{ fontWeight: 700, marginBottom: 2 }}>{title}</div>}
        <div>{message}</div>
      </div>
    </div>
  );
}

export function BdsPanel({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <div className={`bds-r-panel ${className}`} style={style}>{children}</div>;
}

export function BdsSection({ title, slot, children, className = '' }: {
  title?: ReactNode; slot?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={`bds-r-section ${className}`}>
      {(title || slot) && (
        <header className="bds-r-section--header">
          {title && <BdsText as="h2" size="heavy-lg" className="bds-r-section--title">{title}</BdsText>}
          {slot && <div className="bds-r-section--slot">{slot}</div>}
        </header>
      )}
      <div className="bds-r-section--body">{children}</div>
    </section>
  );
}

export function BdsActionBar({ children, align = 'right', className = '' }: {
  children: ReactNode; align?: 'left' | 'right' | 'space-between'; className?: string;
}) {
  return <div className={`bds-r-action-bar bds-r-action-bar--${align} ${className}`}>{children}</div>;
}

/* BdsTabs — mimics Blueprint BuiTabs visual language (gray-70 text, blue-70
   active with ink bar underneath). Flat API for the common case where only
   the tab bar is needed (content is rendered separately). */
export function BdsTabs({ tabs, activeKey, onChange, ariaLabel, className = '' }: {
  tabs: { key: string; label: ReactNode; disabled?: boolean }[];
  activeKey: string;
  onChange: (key: string) => void;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={`bds-r-tabs ${className}`}>
      {tabs.map(t => (
        <button
          key={t.key}
          role="tab"
          type="button"
          aria-selected={activeKey === t.key}
          disabled={t.disabled}
          onClick={() => onChange(t.key)}
          className={`bds-r-tab ${activeKey === t.key ? 'bds-r-tab--active' : ''}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* Small inline icons used across the component. Not exhaustive — covers what
   the client selections page needs. Matches BdsIcon's sizing + currentColor. */
export function BdsIcon({ name, size = 16, className = '', style }: {
  name: 'check' | 'x' | 'plus' | 'chevron-right' | 'chevron-down' | 'chevron-up' | 'chevron-left' | 'arrow-up' | 'arrow-down' | 'arrow-right' | 'undo' | 'search' | 'heart' | 'heart-filled' | 'edit' | 'send' | 'image' | 'link' | 'camera' | 'zoom-in' | 'sort-asc' | 'sort-desc' | 'sort' | 'comments' | 'comments-filled';
  size?: number; className?: string; style?: CSSProperties;
}) {
  const paths: Record<string, ReactNode> = {
    'check': <path d="M20 6L9 17l-5-5" />,
    'x': <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
    'plus': <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    'chevron-right': <polyline points="9 18 15 12 9 6" />,
    'chevron-left': <polyline points="15 18 9 12 15 6" />,
    'chevron-down': <polyline points="6 9 12 15 18 9" />,
    'chevron-up': <polyline points="18 15 12 9 6 15" />,
    'arrow-up': <><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></>,
    'arrow-down': <><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></>,
    'arrow-right': <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
    'undo': <><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></>,
    'search': <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
    'heart': <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
    'heart-filled': <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="currentColor" />,
    'edit': <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
    'send': <><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>,
    'image': <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></>,
    'link': <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>,
    'camera': <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>,
    'zoom-in': <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></>,
    // Sort icons — BDS sort-ascending / sort-descending paths (viewBox 0 0 32 32 inline-scaled via the 24x24 wrapper)
    'sort-asc': <path fill="currentColor" stroke="none" transform="scale(0.75)" d="M16.122 16.243a.96.96 0 0 1-.96.96h-8.64a.96.96 0 0 1 0-1.92h8.64a.96.96 0 0 1 .96.96m-9.6-6.72h16.32a.96.96 0 0 0 0-1.92H6.522a.96.96 0 1 0 0 1.92m6.72 13.44h-6.72a.96.96 0 1 0 0 1.92h6.72a.96.96 0 0 0 0-1.92m15.08-2.598a.96.96 0 0 0-1.358 0l-3.162 3.162v-9.203a.96.96 0 1 0-1.92 0v9.203l-3.16-3.162a.96.96 0 0 0-1.358 1.358l4.8 4.8a.96.96 0 0 0 1.358 0l4.8-4.8a.96.96 0 0 0 0-1.358" />,
    'sort-desc': <path fill="currentColor" stroke="none" transform="scale(0.75)" d="M5 16a1 1 0 0 1 1-1h9a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1m1-7h7a1 1 0 1 0 0-2H6a1 1 0 0 0 0 2m17 14H6a1 1 0 1 0 0 2h17a1 1 0 1 0 0-2m5.707-12.707-5-5a1 1 0 0 0-1.413 0l-5 5a1 1 0 1 0 1.413 1.413L22 8.413V18a1 1 0 1 0 2 0V8.413l3.293 3.293a1 1 0 0 0 1.413-1.413" />,
    'sort': <path fill="currentColor" stroke="none" transform="scale(0.75)" d="M5 16a1 1 0 0 1 1-1h9a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1m1-7h7a1 1 0 1 0 0-2H6a1 1 0 0 0 0 2m17 14H6a1 1 0 1 0 0 2h17a1 1 0 1 0 0-2m5.707-12.707-5-5a1 1 0 0 0-1.413 0l-5 5a1 1 0 1 0 1.413 1.413L22 8.413V18a1 1 0 1 0 2 0V8.413l3.293 3.293a1 1 0 0 0 1.413-1.413" />,
    // BDS comment icon — 32-viewBox path scaled to fit the 24-viewBox wrapper
    'comments': <path fill="currentColor" stroke="none" fillRule="evenodd" clipRule="evenodd" transform="scale(0.75)" d="M25.192 6.808A13 13 0 0 0 8.026 5.733l-.26.207-.253.213a13 13 0 0 0-3.017 15.9l.107.196-1.069 3.744-.04.162a2 2 0 0 0 .549 1.802l.123.113.13.101a2 2 0 0 0 1.711.295l3.742-1.07.198.108.293.15A13 13 0 0 0 25.192 6.808m-15.94.505a11 11 0 0 1 15.435 15.434l-.188.236-.197.233A11 11 0 0 1 10.65 25.61l-.329-.188-.108-.046a1 1 0 0 0-.61-.018l-4.146 1.185 1.185-4.147.028-.133a1 1 0 0 0-.13-.652A11 11 0 0 1 9.253 7.313M20 17.05a1 1 0 0 1 .117 1.993L20 19.05h-8a1 1 0 0 1-.117-1.993L12 17.05zm1-3a1 1 0 0 0-1-1h-8l-.117.007A1 1 0 0 0 12 15.05h8l.117-.007A1 1 0 0 0 21 14.05" />,
    'comments-filled': <path fill="currentColor" stroke="none" fillRule="evenodd" clipRule="evenodd" transform="scale(0.75)" d="M25.192 6.808A13 13 0 0 0 8.026 5.733l-.26.207-.253.213a13 13 0 0 0-3.017 15.9l.107.196-1.069 3.744-.04.162a2 2 0 0 0 .549 1.802l.123.113.13.101a2 2 0 0 0 1.711.295l3.742-1.07.198.108.293.15A13 13 0 0 0 25.192 6.808M20 17.05a1 1 0 0 1 .117 1.993L20 19.05h-8a1 1 0 0 1-.117-1.993L12 17.05zm1-3a1 1 0 0 0-1-1h-8l-.117.007A1 1 0 0 0 12 15.05h8l.117-.007A1 1 0 0 0 21 14.05" />,
  };
  return (
    <svg
      className={`bds-r-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

/* ───────────── BTRelatedItemTag ─────────────
   Faithful prototype shim of the real BT common component at:
   BTNet/Clients.App/src/commonComponents/entity/relatedItem/RelatedItemTag/RelatedItemTag.tsx
   API mirrors the real `IRelatedItemTagProps` (subject, itemType, hideEntityTypeLabel,
   to, status, amount, onRemove, isComplete, isDisabled). The real component uses
   react-router, BTPopover, BTLightbox, BTIcon, and analytics tracking — those are
   stripped here. Productionize by importing the real RelatedItemTag and dropping
   this shim. */

export enum RelatedItemType {
  None = 0,
  CustomerInvoice = 4,
  Allowance = 11,
  SelectionChoice = 12,
  Selection = 18,
}

const AllowanceTypeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M2.25928 3.20305C1.32316 3.6243 0.5 4.30937 0.5 5.25V7.75C0.5 8.69103 1.32264 9.37614 2.25891 9.79738C2.88695 10.0799 3.6538 10.2883 4.5 10.4019V10.75C4.5 11.691 5.32264 12.3761 6.25891 12.7974C7.24189 13.2396 8.56489 13.5 10 13.5C11.4351 13.5 12.7581 13.2396 13.7411 12.7974C14.6774 12.3761 15.5 11.691 15.5 10.75V8.25655L15.5 8.24998C15.5 7.42295 14.8571 6.79464 14.0945 6.37957C13.4062 6.00494 12.5055 5.7344 11.5 5.59774V5.25C11.5 4.30937 10.6768 3.6243 9.74072 3.20305C8.75766 2.76067 7.43467 2.5 6 2.5C4.56533 2.5 3.24234 2.76067 2.25928 3.20305ZM2.66965 4.11497C1.79613 4.50806 1.5 4.94799 1.5 5.25C1.5 5.55201 1.79613 5.99194 2.66965 6.38503C3.06609 6.56343 3.54313 6.71216 4.07865 6.81865C4.09098 6.8206 4.10317 6.823 4.11519 6.82583C4.68689 6.93692 5.32401 7 6 7C6.67599 7 7.31311 6.93692 7.88481 6.82583C7.89683 6.823 7.90902 6.8206 7.92135 6.81865C8.45687 6.71216 8.93391 6.56343 9.33035 6.38503C10.2039 5.99194 10.5 5.55201 10.5 5.25C10.5 4.94799 10.2039 4.50806 9.33035 4.11497C8.50376 3.74301 7.32675 3.5 6 3.5C4.67325 3.5 3.49624 3.74301 2.66965 4.11497ZM7.5 7.90171C7.02174 7.966 6.51815 8 6 8C5.48185 8 4.97826 7.966 4.5 7.90171V9.39193C4.9678 9.46159 5.472 9.5 6 9.5C6.528 9.5 7.0322 9.46159 7.5 9.39193V7.90171ZM8.5 9.18152V7.71464C8.95353 7.60388 9.37115 7.46326 9.74072 7.29695C10.0086 7.1764 10.2673 7.03424 10.5 6.87067V7.75C10.5 8.05272 10.2039 8.49261 9.33079 8.88543C9.08347 8.9967 8.80475 9.09642 8.5 9.18152ZM7.5 10.7151C7.21945 10.6471 6.95296 10.5679 6.70349 10.4789C6.47276 10.4928 6.23792 10.5 6 10.5C5.83167 10.5 5.66488 10.4964 5.5 10.4894V10.75C5.5 11.0527 5.79611 11.4926 6.66921 11.8854C6.91653 11.9967 7.19525 12.0964 7.5 12.1815V10.7151ZM8.5 12.3919V10.9015C8.97789 10.9657 9.48154 11 10 11C10.5182 11 11.0218 10.966 11.5 10.9018V12.3919C11.0322 12.4616 10.528 12.5 10 12.5C9.472 12.5 8.9678 12.4616 8.5 12.3919ZM3.5 7.71464C3.04647 7.60388 2.62885 7.46326 2.25928 7.29695C1.99139 7.1764 1.73275 7.03424 1.5 6.87067V7.75C1.5 8.05272 1.79611 8.49261 2.66921 8.88543C2.91653 8.9967 3.19525 9.09642 3.5 9.18152V7.71464ZM14.5 8.24743L14.5 8.25V8.25351C14.4977 8.55611 14.2005 8.99412 13.3308 9.38542C12.9356 9.56321 12.4603 9.7115 11.9266 9.81784C11.9108 9.82018 11.8952 9.82325 11.8798 9.82704C11.3095 9.93737 10.6741 9.99998 10 9.99998C9.76049 9.99998 9.52556 9.99199 9.29648 9.9767C9.45127 9.92085 9.59969 9.861 9.74109 9.79738C10.6774 9.37614 11.5 8.69103 11.5 7.75V6.60791C12.3571 6.73703 13.0865 6.96946 13.6165 7.2579C14.2813 7.61977 14.4986 7.98712 14.5 8.24743ZM12.5 10.715V12.1815C12.8048 12.0964 13.0835 11.9967 13.3308 11.8854C14.2039 11.4926 14.5 11.0527 14.5 10.75V9.87134C14.2674 10.0348 14.0089 10.1769 13.7411 10.2974C13.3714 10.4637 12.9537 10.6043 12.5 10.715Z" fill="currentColor"/>
  </svg>
);

const SelectionTypeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 13 13" fill="none" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M1.55443 0.826519C1.64598 0.307348 2.12272 -0.0471547 2.63892 0.00510098L2.71289 0.0153593L6.15972 0.623128C6.67889 0.714673 7.03339 1.19141 6.98113 1.70761L6.97088 1.78158L6.278 5.708L10.025 4.34428C10.5192 4.16438 11.0633 4.39852 11.2771 4.86954L11.3067 4.94195L12.5038 8.23088C12.5877 8.46141 12.5837 8.71404 12.4939 8.94088L12.4932 11.6711C12.4932 12.1983 12.0853 12.6302 11.5679 12.6684L11.4932 12.6711H2.74322C2.60006 12.6711 2.45964 12.6602 2.31842 12.6381C0.836606 12.406 -0.176726 10.9928 0.025735 9.50854L0.0427299 9.39982L1.55443 0.826519Z" fill="currentColor"/>
  </svg>
);

// "OwnerInvoices" icon from Figma (Custom Icon — envelope/letter representing customer invoice).
// Source: figma node 327:110782 — see https://www.figma.com/design/uVQ9C0201Udqcnc18eJK3e
const InvoiceTypeIcon = () => (
  <svg width="14" height="14.5" viewBox="0 0 26 27" fill="none" aria-hidden="true">
    <path fillRule="evenodd" clipRule="evenodd" d="M24 27H2L1.82356 26.9923L1.63318 26.9662L1.51117 26.9394C0.693903 26.7344 0.0764067 26.0264 0.00658797 25.1635L0 25V12C0 11.6881 0.134948 11.4266 0.338518 11.2491L0.445252 11.168L4 8.797V2L4.00549 1.85074L4.01261 1.77413L4.03384 1.63169C4.04944 1.54779 4.07034 1.46559 4.09616 1.38553L4.15616 1.22391L4.20769 1.11153L4.29134 0.959978L4.399 0.80114L4.51784 0.657146L4.65374 0.520929L4.77371 0.419943L4.92093 0.315781L5.06315 0.232543L5.12988 0.198689L5.26677 0.138678L5.46998 0.0709858L5.59611 0.0408021L5.63505 0.0332191C5.70557 0.0202088 5.77761 0.0108811 5.85074 0.00548574L6 0H16C16.221 0 16.4345 0.0731645 16.608 0.206081L16.7071 0.292893L21.7071 5.29289C21.8634 5.44917 21.9626 5.65185 21.9913 5.86856L22 6V8.797L25.5704 11.1787C25.7921 11.3311 25.9547 11.5727 25.9919 11.8695L26 12V25L25.9942 25.1539L25.9711 25.3396L25.9394 25.4888C25.7344 26.3061 25.0264 26.9236 24.1635 26.9934L24 27ZM24 24.999V13.979L16.3578 19.6101C16.0632 19.8272 15.7156 19.9586 15.3535 19.9917L15.1714 20H10.8286C10.4627 20 10.105 19.8996 9.79375 19.7114L9.6422 19.6101L2 13.979V25L24 24.999ZM6 2H15.585L20 6.415V14.44L15.1714 18H10.8286L6 14.441V2ZM16 12C16.5523 12 17 12.4477 17 13C17 13.5128 16.614 13.9355 16.1166 13.9933L16 14H10C9.44771 14 9 13.5523 9 13C9 12.4872 9.38604 12.0645 9.88338 12.0067L10 12H16ZM2.741 12.04L4 11.201V12.968L2.741 12.04ZM22 11.202V12.967L23.258 12.04L22 11.202ZM17 9C17 8.44771 16.5523 8 16 8H10L9.88338 8.00673C9.38604 8.06449 9 8.48716 9 9C9 9.55229 9.44771 10 10 10H16L16.1166 9.99327C16.614 9.93551 17 9.51284 17 9Z" fill="currentColor"/>
  </svg>
);

interface RelatedEntityData {
  name: string;
  icon: ReactNode | null;
}

const RELATED_ENTITY_DATA: Record<RelatedItemType, RelatedEntityData> = {
  [RelatedItemType.None]:            { name: '',                 icon: null },
  [RelatedItemType.CustomerInvoice]: { name: 'Invoice',          icon: <InvoiceTypeIcon /> },
  [RelatedItemType.Allowance]:       { name: 'Allowance',        icon: <AllowanceTypeIcon /> },
  [RelatedItemType.SelectionChoice]: { name: 'Selection choice', icon: <SelectionTypeIcon /> },
  [RelatedItemType.Selection]:       { name: 'Selection',        icon: <SelectionTypeIcon /> },
};

export function BTRelatedItemTag({
  subject,
  itemType = RelatedItemType.None,
  hideEntityTypeLabel = false,
  status,
  amount,
  to,
  onClick,
  onRemove,
  isDisabled = false,
  isComplete = false,
  className = '',
}: {
  subject: ReactNode;
  itemType?: RelatedItemType;
  hideEntityTypeLabel?: boolean;
  status?: ReactNode;
  amount?: ReactNode;
  to?: string;
  onClick?: (e: React.MouseEvent) => void;
  onRemove?: () => void;
  isDisabled?: boolean;
  isComplete?: boolean;
  className?: string;
}) {
  const entity = RELATED_ENTITY_DATA[itemType];
  const isActionable = !!(onClick || to) && !isDisabled;
  const Tag: any = to && !isDisabled ? 'a' : isActionable ? 'button' : 'div';

  return (
    <Tag
      type={Tag === 'button' ? 'button' : undefined}
      href={Tag === 'a' ? to : undefined}
      onClick={isDisabled ? undefined : onClick}
      className={[
        'bt-related-item-tag',
        isActionable ? 'bt-related-item-tag--actionable' : '',
        isDisabled ? 'bt-related-item-tag--disabled' : '',
        isComplete ? 'bt-related-item-tag--complete' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {itemType !== RelatedItemType.None && entity.icon && (
        <span className="bt-related-item-tag--icon" aria-hidden="true">{entity.icon}</span>
      )}
      {itemType !== RelatedItemType.None && !hideEntityTypeLabel && entity.name && (
        <span className="bt-related-item-tag--label">{entity.name}:</span>
      )}
      <span className="bt-related-item-tag--subject">{subject}</span>
      {status && <span className="bt-related-item-tag--status">{status}</span>}
      {amount && <span className="bt-related-item-tag--amount">{amount}</span>}
      {onRemove && (
        <button
          type="button"
          className="bt-related-item-tag--remove"
          aria-label="Remove"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
        >
          ×
        </button>
      )}
    </Tag>
  );
}
