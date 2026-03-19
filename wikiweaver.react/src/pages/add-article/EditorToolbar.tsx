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
  <div className="grid grid-cols-2 gap-1.5">
      <Button className="min-h-8 rounded-lg px-2 py-1 text-[11px] whitespace-nowrap" onClick={onTogglePreview} disabled={disabled && !isPreview} title={isPreview ? 'Вернуться к редактированию' : 'Открыть предпросмотр'}>
        {isPreview ? <EyeOff size={13} /> : <Eye size={13} />}
        {isPreview ? 'Редакт.' : 'Просмотр'}
      </Button>
      <Button className="min-h-8 rounded-lg px-2.5 py-1 text-[11px] whitespace-nowrap" variant="primary" onClick={onSave} disabled={disabled || isSaving} title="Сохранить статью">
        <Save size={13} />
        {isSaving ? '...' : 'Сохранить'}
      </Button>
      <Button className="min-h-8 rounded-lg px-2 py-1 text-[11px] whitespace-nowrap" onClick={onImport} disabled={disabled} title="Импортировать Markdown">
        <Import size={13} />
        Импорт MD
      </Button>
      <Button className="min-h-8 rounded-lg px-2 py-1 text-[11px] whitespace-nowrap" onClick={onImproveAll} disabled={disabled || !canImproveWithAi} title="Улучшить статью с помощью ИИ">
        <Sparkles size={13} />
        {isAiRunning ? '...' : 'ИИ'}
      </Button>
  </div>
);
