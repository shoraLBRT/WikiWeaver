import React from 'react';
import { Button, Card, Radio, Space, Typography } from 'antd';
import SimpleMarkdownEditor from '../../components/SimpleMarkdownEditor';
import { locale } from '../../localization';
import type { ParagraphGroupDraft } from './types';

const { Text } = Typography;

type ParagraphGroupEditorProps = {
  group: ParagraphGroupDraft;
  isAiBusy: boolean;
  onAddAlternative: (groupOrder: number) => void;
  onSetDefault: (groupOrder: number, localId: string) => void;
  onImproveWithAi: (groupOrder: number, localId: string) => void;
  onRemoveAlternative: (groupOrder: number, localId: string) => void;
  onContentChange: (groupOrder: number, localId: string, content: string) => void;
};

const ParagraphGroupEditor: React.FC<ParagraphGroupEditorProps> = ({
  group,
  isAiBusy,
  onAddAlternative,
  onSetDefault,
  onImproveWithAi,
  onRemoveAlternative,
  onContentChange,
}) => {
  const t = locale.addArticlePage;

  return (
    <Card
      title={`${t.paragraphTitle} #${group.order}`}
      extra={<Button onClick={() => onAddAlternative(group.order)}>{t.addAlternative}</Button>}
    >
      <Radio.Group
        value={group.alternatives.find((alternative) => alternative.isDefault)?.localId}
        onChange={(event) => onSetDefault(group.order, event.target.value)}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {group.alternatives.map((alternative, index) => (
            <Card
              key={alternative.localId}
              size="small"
              title={(
                <Space>
                  <Radio value={alternative.localId}>{t.version} {index + 1}</Radio>
                  {alternative.isDefault && <Text type="success">{t.defaultLabel}</Text>}
                </Space>
              )}
              extra={(
                <Space>
                  <Button
                    size="small"
                    loading={isAiBusy}
                    onClick={() => onImproveWithAi(group.order, alternative.localId)}
                  >
                    {t.aiStyle}
                  </Button>
                  <Button
                    size="small"
                    danger
                    onClick={() => onRemoveAlternative(group.order, alternative.localId)}
                  >
                    {t.remove}
                  </Button>
                </Space>
              )}
            >
              <SimpleMarkdownEditor
                value={alternative.content}
                onChange={(content) => onContentChange(group.order, alternative.localId, content)}
                placeholder={t.editorPlaceholder}
              />
            </Card>
          ))}
        </Space>
      </Radio.Group>
    </Card>
  );
};

export default ParagraphGroupEditor;
