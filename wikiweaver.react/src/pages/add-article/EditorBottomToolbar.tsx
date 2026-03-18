import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
} from 'lucide-react';
import { Button } from '../../shared/ui/Button';
import type { PlainBlockKind } from './types';

export type FormatAction = 'bold' | 'italic' | 'link' | 'bulletList' | 'orderedList' | 'quote';

type EditorBottomToolbarProps = {
  disabled: boolean;
  onFormat: (action: FormatAction) => void;
  onAddBlock: (kind: PlainBlockKind) => void;
};

const addActions: Array<{ kind: PlainBlockKind; label: string; icon: typeof Pilcrow }> = [
  { kind: 'paragraph', label: 'Текст', icon: Pilcrow },
  { kind: 'heading2', label: 'H2', icon: Heading2 },
  { kind: 'heading3', label: 'H3', icon: Heading3 },
];

const ToolbarIconButton = ({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof Bold;
  label: string;
  onClick: () => void;
  disabled: boolean;
}) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    onClick={onClick}
    disabled={disabled}
    className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-page-panel)] hover:text-[var(--color-ink-strong)] disabled:cursor-not-allowed disabled:opacity-40"
  >
    <Icon size={14} />
  </button>
);

export const EditorBottomToolbar = ({ disabled, onFormat, onAddBlock }: EditorBottomToolbarProps) => (
  <div className="sticky bottom-4 z-10 mt-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-0.5 rounded-xl border border-[var(--color-border-soft)] bg-[rgba(255,255,255,0.94)] px-1 py-1 shadow-[0_18px_48px_rgba(28,27,24,0.08)] backdrop-blur-sm">
        <ToolbarIconButton icon={Bold} label="Жирный" onClick={() => onFormat('bold')} disabled={disabled} />
        <ToolbarIconButton icon={Italic} label="Курсив" onClick={() => onFormat('italic')} disabled={disabled} />
        <ToolbarIconButton icon={LinkIcon} label="Ссылка" onClick={() => onFormat('link')} disabled={disabled} />
        <ToolbarIconButton icon={List} label="Маркированный список" onClick={() => onFormat('bulletList')} disabled={disabled} />
        <ToolbarIconButton icon={ListOrdered} label="Нумерованный список" onClick={() => onFormat('orderedList')} disabled={disabled} />
        <ToolbarIconButton icon={Quote} label="Цитата" onClick={() => onFormat('quote')} disabled={disabled} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[var(--color-border-soft)] bg-[rgba(255,255,255,0.94)] px-1.5 py-1 shadow-[0_18px_48px_rgba(28,27,24,0.08)] backdrop-blur-sm">
        {addActions.map(({ kind, label, icon: Icon }) => (
          <Button
            key={kind}
            className="gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-[var(--color-ink-muted)] shadow-none hover:text-[var(--color-ink-strong)]"
            onClick={() => onAddBlock(kind)}
            disabled={disabled}
          >
            <Icon size={12} />
            {label}
          </Button>
        ))}
      </div>
    </div>
  </div>
);
