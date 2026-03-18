import { Eye, EyeOff, Import, Save, Sparkles } from 'lucide-react';
import { Button } from '../../shared/ui/Button';

type EditorToolbarProps = {
  disabled: boolean;
  isPreview: boolean;
  canImproveWithAi: boolean;
  isAiRunning: boolean;
  isSaving: boolean;
  onTogglePreview: () => void;
  onImport: () => void;
  onImproveAll: () => void;
  onSave: () => void;
};

export const EditorToolbar = ({
  disabled,
  isPreview,
  canImproveWithAi,
  isAiRunning,
  isSaving,
  onTogglePreview,
  onImport,
  onImproveAll,
  onSave,
}: EditorToolbarProps) => (
  <div className="sticky top-[var(--layout-header-height)] z-20 border-b border-[var(--color-border-soft)] bg-[rgba(255,255,255,0.95)] px-4 py-2 backdrop-blur-md sm:px-6 lg:px-8">
    <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-end gap-2">
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
);
