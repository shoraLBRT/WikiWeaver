import React, { useMemo } from 'react';
import { locale } from '../localization';
import { Button } from '../shared/ui/Button';
import { Textarea } from '../shared/ui/Textarea';

interface SimpleMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SimpleMarkdownEditor: React.FC<SimpleMarkdownEditorProps> = ({ value, onChange, placeholder }) => {
  const insertAroundSelection = (prefix: string, suffix = prefix) => {
    onChange(`${value}${prefix}${locale.markdownEditor.insertText}${suffix}`);
  };

  const lineCount = useMemo(() => (value ? value.split('\n').length : 0), [value]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button className="px-3 py-1.5 text-xs" onClick={() => insertAroundSelection('**')}>{locale.markdownEditor.bold}</Button>
        <Button className="px-3 py-1.5 text-xs" onClick={() => insertAroundSelection('_')}>{locale.markdownEditor.italic}</Button>
        <Button className="px-3 py-1.5 text-xs" onClick={() => onChange(`${value}\n## ${locale.markdownEditor.headingSnippet}`)}>{locale.markdownEditor.heading}</Button>
        <Button className="px-3 py-1.5 text-xs" onClick={() => onChange(`${value}\n- ${locale.markdownEditor.listSnippet}`)}>{locale.markdownEditor.list}</Button>
        <Button className="px-3 py-1.5 text-xs" onClick={() => onChange(`${value}\n> ${locale.markdownEditor.quoteSnippet}`)}>{locale.markdownEditor.quote}</Button>
      </div>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-48 rounded-2xl border-[var(--color-border-soft)] bg-white/90 px-4 py-3 font-mono text-[13px] leading-6"
      />
      <p className="m-0 text-xs text-[var(--color-ink-subtle)]">{locale.markdownEditor.lineCount}: {lineCount}</p>
    </div>
  );
};

export default SimpleMarkdownEditor;
