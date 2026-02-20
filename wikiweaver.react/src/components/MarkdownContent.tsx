import React from 'react';

type MarkdownContentProps = {
  content: string;
};

type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'strong'; value: string }
  | { type: 'emphasis'; value: string }
  | { type: 'code'; value: string }
  | { type: 'link'; label: string; href: string };

const safeHrefPattern = /^(https?:\/\/|mailto:)/i;

const parseInline = (text: string): InlineToken[] => {
  const tokens: InlineToken[] = [];
  const pattern = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|`([^`]+)`)/g;
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, index) });
    }

    const [, fullLink, linkLabel, href, boldAsterisk, boldUnderscore, italicAsterisk, italicUnderscore, inlineCode] = match;

    if (fullLink && linkLabel && href && safeHrefPattern.test(href.trim())) {
      tokens.push({ type: 'link', label: linkLabel, href: href.trim() });
    } else if (boldAsterisk || boldUnderscore) {
      tokens.push({ type: 'strong', value: boldAsterisk ?? boldUnderscore ?? '' });
    } else if (italicAsterisk || italicUnderscore) {
      tokens.push({ type: 'emphasis', value: italicAsterisk ?? italicUnderscore ?? '' });
    } else if (inlineCode) {
      tokens.push({ type: 'code', value: inlineCode });
    } else {
      tokens.push({ type: 'text', value: match[0] });
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return tokens.length > 0 ? tokens : [{ type: 'text', value: text }];
};

const renderInline = (text: string, keyPrefix: string): React.ReactNode[] =>
  parseInline(text).map((token, tokenIndex) => {
    const key = `${keyPrefix}-${token.type}-${tokenIndex}`;

    switch (token.type) {
      case 'link':
        return (
          <a key={key} href={token.href} target="_blank" rel="noopener noreferrer">
            {token.label}
          </a>
        );
      case 'strong':
        return <strong key={key}>{token.value}</strong>;
      case 'emphasis':
        return <em key={key}>{token.value}</em>;
      case 'code':
        return <code key={key}>{token.value}</code>;
      default:
        return <React.Fragment key={key}>{token.value}</React.Fragment>;
    }
  });

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
      nodes.push(
        React.createElement(`h${level}`, { key: `heading-${index}` }, renderInline(headingMatch[2], `heading-${index}`)),
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
        const item = lines[index].trim().replace(/^[-*+]\s+/, '');
        items.push(<li key={`ul-${index}`}>{renderInline(item, `ul-${index}`)}</li>);
        index += 1;
      }
      nodes.push(<ul key={`ul-list-${index}`}>{items}</ul>);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: React.ReactNode[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        const item = lines[index].trim().replace(/^\d+\.\s+/, '');
        items.push(<li key={`ol-${index}`}>{renderInline(item, `ol-${index}`)}</li>);
        index += 1;
      }
      nodes.push(<ol key={`ol-list-${index}`}>{items}</ol>);
      continue;
    }

    if (line.trimStart().startsWith('> ')) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index].trimStart().startsWith('> ')) {
        quoteLines.push(lines[index].trimStart().replace(/^>\s?/, ''));
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

    nodes.push(<p key={`paragraph-${index}`}>{renderInline(paragraphLines.join(' '), `paragraph-${index}`)}</p>);
  }

  return <>{nodes}</>;
};

export default MarkdownContent;
