import React from 'react';
import { Button, Card, Radio, Space, Typography } from 'antd';
import { locale } from '../../localization';
import type { ParagraphGroupDraft } from './types';
import styles from './ParagraphGroupEditor.module.css';

const { Text } = Typography;

type ParagraphGroupEditorProps = {
  group: ParagraphGroupDraft;
  onAddAlternative: (groupOrder: number) => void;
  onSetDefault: (groupOrder: number, localId: string) => void;
  onRemoveAlternative: (groupOrder: number, localId: string) => void;
  onContentChange: (groupOrder: number, localId: string, content: string) => void;
  onActivateEditor: (groupOrder: number, localId: string) => void;
};

const ParagraphGroupEditor: React.FC<ParagraphGroupEditorProps> = ({
  group,
  onAddAlternative,
  onSetDefault,
  onRemoveAlternative,
  onContentChange,
  onActivateEditor,
}) => {
  const t = locale.addArticlePage;

  return (
    <Card
      className={styles.groupCard}
      title={`${t.paragraphTitle} #${group.order}`}
      extra={<Button onClick={() => onAddAlternative(group.order)}>{t.addAlternative}</Button>}
    >
      <Radio.Group
        value={group.alternatives.find((alternative) => alternative.isDefault)?.localId}
        onChange={(event) => onSetDefault(group.order, event.target.value)}
        style={{ width: '100%' }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {group.alternatives.map((alternative, index) => (
            <Card
              key={alternative.localId}
              size="small"
              className={styles.alternativeCard}
              title={(
                <Space>
                  <Radio value={alternative.localId}>{t.version} {index + 1}</Radio>
                  {alternative.isDefault && <Text type="success">{t.defaultLabel}</Text>}
                </Space>
              )}
              extra={(
                <Button
                  size="small"
                  danger
                  onClick={() => onRemoveAlternative(group.order, alternative.localId)}
                >
                  {t.remove}
                </Button>
              )}
            >
              <textarea
                value={alternative.content}
                onFocus={() => onActivateEditor(group.order, alternative.localId)}
                onChange={(event) => onContentChange(group.order, alternative.localId, event.target.value)}
                placeholder={t.editorPlaceholder}
                className={styles.plainTextArea}
              />
            </Card>
          ))}
        </Space>
      </Radio.Group>
    </Card>
  );
};

export default ParagraphGroupEditor;
