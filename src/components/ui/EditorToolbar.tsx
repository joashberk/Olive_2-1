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
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'list-disc list-outside ml-4'
          }
        },
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
        class: 'prose prose-invert max-w-none prose-p:leading-relaxed focus:outline-none'
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Backspace') {
          const { state } = view;
          const { selection } = state;
          const { $from, empty } = selection;
          
          if (empty && $from.parent.type.name === 'listItem' && $from.parent.textContent === '') {
            // If we're in an empty list item
            view.dispatch(state.tr.deleteRange($from.pos - 2, $from.pos + 1));
            return true;
          }
        }
        return false;
      }
    }
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="relative">
      <style dangerouslySetInnerHTML={{ __html: `
        .ProseMirror p {
          font-size: 1.25rem !important;
          line-height: 1.625 !important;
          margin-bottom: 0.5em !important;
          font-family: "SF Pro Text", system-ui, sans-serif !important;
          color: #777777 !important;
        }

        .ProseMirror h2 {
          font-size: 1.5rem !important;
          line-height: 1.4 !important;
          font-family: "SF Pro Display", system-ui, sans-serif !important;
          font-weight: 400 !important;
          margin-top: 1em !important;
          margin-bottom: 0.5em !important;
          color: var(--dark-100) !important;
        }

        /* Add more space after h2 paragraphs */
        .ProseMirror h2 + p {
          margin-top: 1.25em !important;
        }

        /* Highlight styling */
        .ProseMirror mark {
          padding: 0.1em 0.2em !important;
          margin: 0 -0.2em !important;
          border-radius: 0.2em !important;
          color: #ffffff !important;
          background-color: rgba(132, 204, 22, 0.3) !important;
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