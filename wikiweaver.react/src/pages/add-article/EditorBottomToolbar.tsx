import {
  Bold,
  GitBranch,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Type,
} from 'lucide-react';
import { Button } from '../../shared/ui/Button';

export type FormatAction = 'bold' | 'italic' | 'link' | 'bulletList' | 'orderedList' | 'quote';

type EditorBottomToolbarProps = {
  disabled: boolean;
  onFormat: (action: FormatAction) => void;
  onAddBlock: (kind: 'paragraph' | 'heading2' | 'heading3' | 'versioned') => void;
};

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

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--color-border-soft)] bg-[rgba(255,255,255,0.94)] px-2 py-1 shadow-[0_18px_48px_rgba(28,27,24,0.08)] backdrop-blur-sm">
        <Button className="px-3 py-1.5 text-xs" onClick={() => onAddBlock('paragraph')} disabled={disabled}>
          <Type size={13} />
          Параграф
        </Button>
        <Button className="px-3 py-1.5 text-xs" onClick={() => onAddBlock('heading2')} disabled={disabled}>
          <Heading2 size={13} />
          H2
        </Button>
        <Button className="px-3 py-1.5 text-xs" onClick={() => onAddBlock('heading3')} disabled={disabled}>
          <Heading3 size={13} />
          H3
        </Button>
        <Button className="px-3 py-1.5 text-xs" onClick={() => onAddBlock('versioned')} disabled={disabled}>
          <GitBranch size={13} />
          Версионный блок
        </Button>
      </div>
    </div>
  </div>
);
