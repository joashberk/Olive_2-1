import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Underline as UnderlineIcon,
  List,
  Link as LinkIcon,
  Heading2
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface EditorToolbarProps {
  content: string;
  onChange: (content: string) => void;
}

export function EditorToolbar({ content, onChange }: EditorToolbarProps) {
  const [viewportOffset, setViewportOffset] = useState(0);
  const toolbarRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!window.visualViewport) return;

    const updateToolbarPosition = () => {
      if (!window.visualViewport) return;
      const offsetFromBottom = window.innerHeight - window.visualViewport.height;
      setViewportOffset(offsetFromBottom);
    };

    updateToolbarPosition();

    window.visualViewport.addEventListener('resize', updateToolbarPosition);
    window.visualViewport.addEventListener('scroll', updateToolbarPosition);

    return () => {
      window.visualViewport?.removeEventListener('resize', updateToolbarPosition);
      window.visualViewport?.removeEventListener('scroll', updateToolbarPosition);
    };
  }, []);

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
        },
        italic: true,
        strike: true,
        bold: true
      }),
      TextStyle,
      Color,
      Underline.configure({
        HTMLAttributes: {
          class: 'underline'
        }
      }),
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
      }
    }
  });

  if (!editor) {
    return null;
  }

  const ToolbarButtons = () => {
    const handleButtonClick = (action: () => void) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      action();
      // Ensure editor keeps focus after button click
      requestAnimationFrame(() => {
        editor.commands.focus();
      });
    };

    return (
      <>
        <button
          onTouchStart={(e) => e.stopPropagation()}
          onClick={handleButtonClick(() => editor.chain().focus().toggleBold().run())}
          className={`p-2.5 text-dark-300 hover:text-dark-200 active:bg-dark-700/50 rounded-md ${
            editor.isActive('bold') ? 'text-olive-300 bg-dark-700/50' : ''
          }`}
        >
          <Bold className="w-5 h-5" />
        </button>
        <button
          onTouchStart={(e) => e.stopPropagation()}
          onClick={handleButtonClick(() => editor.chain().focus().toggleItalic().run())}
          className={`p-2.5 text-dark-300 hover:text-dark-200 active:bg-dark-700/50 rounded-md ${
            editor.isActive('italic') ? 'text-olive-300 bg-dark-700/50' : ''
          }`}
        >
          <Italic className="w-5 h-5" />
        </button>
        <button
          onTouchStart={(e) => e.stopPropagation()}
          onClick={handleButtonClick(() => editor.chain().focus().toggleUnderline().run())}
          className={`p-2.5 text-dark-300 hover:text-dark-200 active:bg-dark-700/50 rounded-md ${
            editor.isActive('underline') ? 'text-olive-300 bg-dark-700/50' : ''
          }`}
        >
          <UnderlineIcon className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-dark-700/50 mx-1" />

        <button
          onTouchStart={(e) => e.stopPropagation()}
          onClick={handleButtonClick(() => editor.chain().focus().toggleBulletList().run())}
          className={`p-2.5 text-dark-300 hover:text-dark-200 active:bg-dark-700/50 rounded-md ${
            editor.isActive('bulletList') ? 'text-olive-300 bg-dark-700/50' : ''
          }`}
        >
          <List className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-dark-700/50 mx-1" />

        <button
          onTouchStart={(e) => e.stopPropagation()}
          onClick={handleButtonClick(() => editor.chain().focus().toggleStrike().run())}
          className={`p-2.5 text-dark-300 hover:text-dark-200 active:bg-dark-700/50 rounded-md ${
            editor.isActive('strike') ? 'text-olive-300 bg-dark-700/50' : ''
          }`}
        >
          <Strikethrough className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-dark-700/50 mx-1" />

        <button
          onTouchStart={(e) => e.stopPropagation()}
          onClick={handleButtonClick(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
          className={`p-2.5 text-dark-300 hover:text-dark-200 active:bg-dark-700/50 rounded-md ${
            editor.isActive('heading', { level: 2 }) ? 'text-olive-300 bg-dark-700/50' : ''
          }`}
        >
          <Heading2 className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-dark-700/50 mx-1" />

        <button
          onTouchStart={(e) => e.stopPropagation()}
          onClick={handleButtonClick(() => {
            const url = window.prompt('Enter the URL');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          })}
          className={`p-2.5 text-dark-300 hover:text-dark-200 active:bg-dark-700/50 rounded-md ${
            editor.isActive('link') ? 'text-olive-300 bg-dark-700/50' : ''
          }`}
        >
          <LinkIcon className="w-5 h-5" />
        </button>
      </>
    );
  };

  return (
    <div className="relative">
      <style dangerouslySetInnerHTML={{ __html: `
        .ProseMirror {
          min-height: 100vh !important;
          padding-bottom: 60px !important;
        }
        
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

        .ProseMirror h2 + p {
          margin-top: 1.25em !important;
        }

        .ProseMirror ul {
          list-style-type: disc !important;
          padding-left: 1.5em !important;
          margin-bottom: 1em !important;
        }

        .ProseMirror ul li {
          margin-bottom: 0.5em !important;
        }

        @media (max-width: 768px) {
          .ProseMirror {
            padding-bottom: 120px !important;
          }
        }
      `}} />

      <EditorContent editor={editor} />
      
      {/* Desktop bubble menu */}
      <BubbleMenu 
        editor={editor} 
        tippyOptions={{ 
          duration: 100,
          placement: 'top',
        }}
        className="hidden md:flex items-center gap-0.5 bg-dark-800 border border-dark-700 rounded-lg shadow-lg overflow-visible whitespace-nowrap min-w-max"
      >
        <ToolbarButtons />
      </BubbleMenu>

      {/* Mobile keyboard accessory toolbar */}
      <div 
        ref={toolbarRef}
        className="md:hidden fixed left-0 right-0 bottom-0 bg-[#2C2C2E] border-t border-[#3C3C3E] z-[100] will-change-transform"
        style={{
          transform: `translateY(-${viewportOffset}px)`,
          WebkitTransform: `translateY(-${viewportOffset}px)`
        }}
      >
        <div className="overflow-x-auto py-2 flex items-center gap-0.5 scrollbar-none">
          <div className="flex-1 flex items-center justify-center min-w-0 px-2">
            <ToolbarButtons />
          </div>
        </div>
      </div>
    </div>
  );
} 