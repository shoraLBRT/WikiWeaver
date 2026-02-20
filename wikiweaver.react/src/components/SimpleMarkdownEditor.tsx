import React, { useMemo } from 'react';
import { Button, Space, Typography } from 'antd';

const { Text } = Typography;

interface SimpleMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SimpleMarkdownEditor: React.FC<SimpleMarkdownEditorProps> = ({ value, onChange, placeholder }) => {
  const insertAroundSelection = (prefix: string, suffix = prefix) => {
    onChange(`${value}${prefix}текст${suffix}`);
  };

  const lineCount = useMemo(() => (value ? value.split('\n').length : 0), [value]);

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <Space wrap>
        <Button size="small" onClick={() => insertAroundSelection('**')}>Bold</Button>
        <Button size="small" onClick={() => insertAroundSelection('_')}>Italic</Button>
        <Button size="small" onClick={() => onChange(`${value}\n## Заголовок`) }>H2</Button>
        <Button size="small" onClick={() => onChange(`${value}\n- Пункт`) }>List</Button>
        <Button size="small" onClick={() => onChange(`${value}\n> Цитата`) }>Quote</Button>
      </Space>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', minHeight: 160, borderRadius: 8, border: '1px solid #d9d9d9', padding: 12, fontFamily: 'monospace' }}
      />
      <Text type="secondary">Markdown строк: {lineCount}</Text>
    </Space>
  );
};

export default SimpleMarkdownEditor;
