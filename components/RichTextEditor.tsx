import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const ToolbarButton: React.FC<{
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title: string;
}> = ({ onClick, isActive, children, title }) => (
  <button
    type="button"
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    title={title}
    className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
    }`}
  >
    {children}
  </button>
);

export const RichTextEditor: React.FC<Props> = ({ value, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Treat empty paragraph as empty string
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  // Sync external value changes (e.g., when form resets)
  React.useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const normalizedValue = value === '' ? '<p></p>' : value;
    if (current !== normalizedValue && current !== value) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1.5 bg-gray-50 border-b border-gray-200 flex-wrap">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="粗體 (Bold)"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="斜體 (Italic)"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="刪除線 (Strikethrough)"
        >
          <s>S</s>
        </ToolbarButton>

        <span className="w-px h-4 bg-gray-300 mx-0.5" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="標題 1 (H1)"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="標題 2 (H2)"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="標題 3 (H3)"
        >
          H3
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <div className="relative">
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none p-2.5 text-xs min-h-[80px] focus:outline-none"
        />
        {!value && placeholder && (
          <div className="absolute top-2.5 left-2.5 text-gray-400 text-xs pointer-events-none select-none">
            {placeholder}
          </div>
        )}
      </div>

      <style>{`
        .ProseMirror {
          outline: none;
          min-height: 80px;
        }
        .ProseMirror p { margin: 0.25em 0; }
        .ProseMirror h1 { font-size: 1.25rem; font-weight: 700; margin: 0.5em 0 0.25em; }
        .ProseMirror h2 { font-size: 1.1rem; font-weight: 600; margin: 0.4em 0 0.2em; }
        .ProseMirror h3 { font-size: 1rem; font-weight: 600; margin: 0.3em 0 0.15em; }
        .ProseMirror strong { font-weight: 700; }
        .ProseMirror em { font-style: italic; }
        .ProseMirror s { text-decoration: line-through; }
        .ProseMirror ul { list-style: disc; padding-left: 1.2em; margin: 0.3em 0; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.2em; margin: 0.3em 0; }
      `}</style>
    </div>
  );
};
