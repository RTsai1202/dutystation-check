import React from 'react';
import DOMPurify from 'dompurify';

interface Props {
  html: string;
  className?: string;
}

export const RichTextDisplay: React.FC<Props> = ({ html, className = '' }) => {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 's', 'strike', 'del',
                   'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li',
                   'a', 'code', 'pre', 'blockquote'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });

  if (!sanitized) return null;

  return (
    <div
      className={`rich-text-display ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};
