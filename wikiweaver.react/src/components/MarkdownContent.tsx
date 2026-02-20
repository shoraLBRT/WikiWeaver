import React from 'react';

type MarkdownContentProps = {
  content: string;
};

const inlinePattern = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;

const renderInline = (text: string, keyPrefix: string): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let matchIndex = 0;

  for (const match of text.matchAll(inlinePattern)) {
    const [fullMatch, , linkText, linkHref, boldText, italicText, codeText] = match;
    const index = match.index ?? 0;

    if (index > lastIndex) {
      elements.push(text.slice(lastIndex, index));
    }

    if (linkText && linkHref) {
      elements.push(
        <a key={`${keyPrefix}-link-${matchIndex}`} href={linkHref} target="_blank" rel="noreferrer">
          {linkText}
        </a>,
      );
    } else if (boldText) {
      elements.push(<strong key={`${keyPrefix}-strong-${matchIndex}`}>{boldText}</strong>);
    } else if (italicText) {
      elements.push(<em key={`${keyPrefix}-em-${matchIndex}`}>{italicText}</em>);
    } else if (codeText) {
      elements.push(<code key={`${keyPrefix}-code-${matchIndex}`}>{codeText}</code>);
    } else {
      elements.push(fullMatch);
    }

    lastIndex = index + fullMatch.length;
    matchIndex += 1;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements.length > 0 ? elements : [text];
};

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => {
  const lines = content.split(/\r?\n/);
  const nodes: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]?.trimEnd() ?? '';

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const headingTag = `h${level}`;

      nodes.push(
        React.createElement(
          headingTag,
          { key: `heading-${index}` },
          renderInline(headingText, `heading-${index}`),
        ),
      );
      index += 1;
      continue;
    }

    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].trimStart().startsWith('```')) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      nodes.push(
        <pre key={`codeblock-${index}`}>
          <code>{codeLines.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    if (/^[-*+]\s+/.test(line)) {
      const items: React.ReactNode[] = [];

      while (index < lines.length && /^[-*+]\s+/.test(lines[index].trim())) {
        const itemContent = lines[index].trim().replace(/^[-*+]\s+/, '');
        items.push(<li key={`ul-${index}`}>{renderInline(itemContent, `ul-${index}`)}</li>);
        index += 1;
      }

      nodes.push(<ul key={`ul-list-${index}`}>{items}</ul>);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: React.ReactNode[] = [];

      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        const itemContent = lines[index].trim().replace(/^\d+\.\s+/, '');
        items.push(<li key={`ol-${index}`}>{renderInline(itemContent, `ol-${index}`)}</li>);
        index += 1;
      }

      nodes.push(<ol key={`ol-list-${index}`}>{items}</ol>);
      continue;
    }

    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];

      while (index < lines.length && lines[index].trim().startsWith('> ')) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
        index += 1;
      }

      nodes.push(
        <blockquote key={`quote-${index}`}>
          {renderInline(quoteLines.join(' '), `quote-${index}`)}
        </blockquote>,
      );
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length && lines[index].trim()) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    nodes.push(
      <p key={`paragraph-${index}`}>
        {renderInline(paragraphLines.join(' '), `paragraph-${index}`)}
      </p>,
    );
  }

  return <>{nodes}</>;
};

export default MarkdownContent;
