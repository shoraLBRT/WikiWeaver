import { Eye, EyeOff, Import, Save, Sparkles } from 'lucide-react';
import { locale } from '../../localization';
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
}: EditorToolbarProps) => {
  const t = locale.addArticleEditor.topToolbar;

  return (
    <div className="grid grid-cols-2 gap-1.5">
      <Button className="min-h-8 rounded-lg px-2 py-1 text-[11px] whitespace-nowrap" onClick={onTogglePreview} disabled={disabled && !isPreview} title={isPreview ? t.previewOff : t.previewOn}>
        {isPreview ? <EyeOff size={13} /> : <Eye size={13} />}
        {isPreview ? t.editLabel : t.previewLabel}
      </Button>
      <Button className="min-h-8 rounded-lg px-2.5 py-1 text-[11px] whitespace-nowrap" variant="primary" onClick={onSave} disabled={disabled || isSaving} title={t.saveTitle}>
        <Save size={13} />
        {isSaving ? '...' : t.save}
      </Button>
      <Button className="min-h-8 rounded-lg px-2 py-1 text-[11px] whitespace-nowrap" onClick={onImport} disabled={disabled} title={t.importTitle}>
        <Import size={13} />
        {t.import}
      </Button>
      <Button className="min-h-8 rounded-lg px-2 py-1 text-[11px] whitespace-nowrap" onClick={onImproveAll} disabled={disabled || !canImproveWithAi} title={t.improveWithAiTitle}>
        <Sparkles size={13} />
        {isAiRunning ? '...' : t.improveWithAi}
      </Button>
    </div>
  );
};
