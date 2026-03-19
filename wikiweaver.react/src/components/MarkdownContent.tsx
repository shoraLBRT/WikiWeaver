import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

type MarkdownContentProps = {
  content: string;
};

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeSanitize]}
    components={{
      a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" />,
    }}
  >
    {content}
  </ReactMarkdown>
);

export default MarkdownContent;
