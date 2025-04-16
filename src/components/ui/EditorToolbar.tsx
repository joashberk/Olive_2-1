import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Underline as UnderlineIcon,
  List,
  Link as LinkIcon,
  Heading2,
  Highlighter
} from 'lucide-react';

interface EditorToolbarProps {
  content: string;
  onChange: (content: string) => void;
}

export function EditorToolbar({ content, onChange }: EditorToolbarProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2]
        }
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true
      }),
      Underline,
      Link.configure({
        openOnClick: false
      })
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none prose-p:text-lg prose-p:leading-relaxed focus:outline-none'
      }
    }
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="relative">
      <style dangerouslySetInnerHTML={{ __html: `
        .ProseMirror h2 {
          font-size: 1.15em !important;
          line-height: 1.4 !important;
          font-family: var(--font-serif) !important;
          margin-top: 1em !important;
          margin-bottom: 0.5em !important;
        }
      `}} />

      <EditorContent editor={editor} />
      
      <BubbleMenu 
        editor={editor} 
        tippyOptions={{ 
          duration: 100,
          placement: 'top',
        }}
        className="flex items-center gap-0.5 bg-dark-800 border border-dark-700 rounded-lg shadow-lg overflow-visible whitespace-nowrap min-w-max"
      >
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 text-dark-300 hover:text-dark-200 hover:bg-dark-700 ${
            editor.isActive('bold') ? 'text-olive-300 bg-dark-700' : ''
          }`}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 text-dark-300 hover:text-dark-200 hover:bg-dark-700 ${
            editor.isActive('italic') ? 'text-olive-300 bg-dark-700' : ''
          }`}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHighlight({ color: '#84cc1610' }).run()}
          className={`p-2 text-dark-300 hover:text-dark-200 hover:bg-dark-700 ${
            editor.isActive('highlight') ? 'text-olive-300 bg-dark-700' : ''
          }`}
        >
          <Highlighter className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 text-dark-300 hover:text-dark-200 hover:bg-dark-700 ${
            editor.isActive('underline') ? 'text-olive-300 bg-dark-700' : ''
          }`}
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-dark-700 mx-0.5" />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 text-dark-300 hover:text-dark-200 hover:bg-dark-700 ${
            editor.isActive('bulletList') ? 'text-olive-300 bg-dark-700' : ''
          }`}
        >
          <List className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-dark-700 mx-0.5" />

        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 text-dark-300 hover:text-dark-200 hover:bg-dark-700 ${
            editor.isActive('strike') ? 'text-olive-300 bg-dark-700' : ''
          }`}
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-dark-700 mx-0.5" />

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 text-dark-300 hover:text-dark-200 hover:bg-dark-700 ${
            editor.isActive('heading', { level: 2 }) ? 'text-olive-300 bg-dark-700' : ''
          }`}
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-dark-700 mx-0.5" />

        <button
          onClick={() => {
            const url = window.prompt('Enter the URL');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`p-2 text-dark-300 hover:text-dark-200 hover:bg-dark-700 ${
            editor.isActive('link') ? 'text-olive-300 bg-dark-700' : ''
          }`}
        >
          <LinkIcon className="w-4 h-4" />
        </button>
      </BubbleMenu>
    </div>
  );
} 