import {
  Bold,
  Eye,
  EyeOff,
  GitBranch,
  Heading2,
  Heading3,
  Import,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Save,
  Sparkles,
  Type,
} from 'lucide-react';
import { Button } from '../../shared/ui/Button';

type FormatAction = 'bold' | 'italic' | 'link' | 'bulletList' | 'orderedList' | 'quote';

type EditorToolbarProps = {
  disabled: boolean;
  isPreview: boolean;
  canImproveWithAi: boolean;
  isAiRunning: boolean;
  isSaving: boolean;
  onFormat: (action: FormatAction) => void;
  onAddBlock: (kind: 'paragraph' | 'heading2' | 'heading3' | 'versioned') => void;
  onTogglePreview: () => void;
  onImport: () => void;
  onImproveAll: () => void;
  onSave: () => void;
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

export const EditorToolbar = ({
  disabled,
  isPreview,
  canImproveWithAi,
  isAiRunning,
  isSaving,
  onFormat,
  onAddBlock,
  onTogglePreview,
  onImport,
  onImproveAll,
  onSave,
}: EditorToolbarProps) => (
  <div className="sticky top-[var(--layout-header-height)] z-20 border-b border-[var(--color-border-soft)] bg-[rgba(255,255,255,0.95)] px-4 py-2 backdrop-blur-md sm:px-6 lg:px-8">
    <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-2">
      <div className="flex items-center gap-0.5 rounded-xl border border-[var(--color-border-soft)] bg-white px-1 py-1">
        <ToolbarIconButton icon={Bold} label="Жирный" onClick={() => onFormat('bold')} disabled={disabled} />
        <ToolbarIconButton icon={Italic} label="Курсив" onClick={() => onFormat('italic')} disabled={disabled} />
        <ToolbarIconButton icon={LinkIcon} label="Ссылка" onClick={() => onFormat('link')} disabled={disabled} />
        <ToolbarIconButton icon={List} label="Маркированный список" onClick={() => onFormat('bulletList')} disabled={disabled} />
        <ToolbarIconButton icon={ListOrdered} label="Нумерованный список" onClick={() => onFormat('orderedList')} disabled={disabled} />
        <ToolbarIconButton icon={Quote} label="Цитата" onClick={() => onFormat('quote')} disabled={disabled} />
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border-soft)] bg-white px-2 py-1">
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

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Button onClick={onTogglePreview} disabled={disabled && !isPreview}>
          {isPreview ? <EyeOff size={14} /> : <Eye size={14} />}
          {isPreview ? 'Редактирование' : 'Предпросмотр'}
        </Button>
        <Button onClick={onImport} disabled={disabled}>
          <Import size={14} />
          Импорт Markdown
        </Button>
        <Button onClick={onImproveAll} disabled={disabled || !canImproveWithAi}>
          <Sparkles size={14} />
          {isAiRunning ? 'ИИ обрабатывает...' : 'Улучшить статью с ИИ'}
        </Button>
        <Button variant="primary" onClick={onSave} disabled={disabled || isSaving}>
          <Save size={14} />
          {isSaving ? 'Сохранение...' : 'Сохранить статью'}
        </Button>
      </div>
    </div>
  </div>
);
