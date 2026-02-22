import React, { useMemo } from 'react';
import { Button, Space, Typography } from 'antd';
import { locale } from '../localization';

const { Text } = Typography;

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
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Space wrap>
        <Button size="small" onClick={() => insertAroundSelection('**')}>{locale.markdownEditor.bold}</Button>
        <Button size="small" onClick={() => insertAroundSelection('_')}>{locale.markdownEditor.italic}</Button>
        <Button size="small" onClick={() => onChange(`${value}\n## ${locale.markdownEditor.headingSnippet}`)}>{locale.markdownEditor.heading}</Button>
        <Button size="small" onClick={() => onChange(`${value}\n- ${locale.markdownEditor.listSnippet}`)}>{locale.markdownEditor.list}</Button>
        <Button size="small" onClick={() => onChange(`${value}\n> ${locale.markdownEditor.quoteSnippet}`)}>{locale.markdownEditor.quote}</Button>
      </Space>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', minHeight: 160, borderRadius: 8, border: '1px solid #d9d9d9', padding: 12, fontFamily: 'monospace' }}
      />
      <Text type="secondary">{locale.markdownEditor.lineCount}: {lineCount}</Text>
    </Space>
  );
};

export default SimpleMarkdownEditor;
