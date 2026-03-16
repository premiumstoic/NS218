"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import "./rich-text-editor.css";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export function RichTextEditor({ value, onChange, placeholder = "Enter text...", maxLength = 3000 }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3]
        }
      }),
      Link.configure({
        openOnClick: false,
        autolink: true
      })
    ],
    immediatelyRender: false,
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: "rich-text-editor",
        "data-placeholder": placeholder
      }
    }
  });

  if (!editor) {
    return null;
  }

  const charCount = editor.getText().length;
  const isNearLimit = charCount > maxLength * 0.9;

  return (
    <div className="rich-text-editor-wrapper">
      <div className="rte-toolbar">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "active" : ""}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "active" : ""}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "active" : ""}
          title="Heading"
        >
          H
        </button>
        <div className="rte-divider" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "active" : ""}
          title="Bullet List"
        >
          •
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "active" : ""}
          title="Numbered List"
        >
          1.
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive("codeBlock") ? "active" : ""}
          title="Code Block"
        >
          &lt;&gt;
        </button>
        <div className="rte-divider" />
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          title="Undo"
        >
          ↶
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          title="Redo"
        >
          ↷
        </button>
      </div>
      <EditorContent editor={editor} />
      <div className={`rte-footer ${isNearLimit ? "warning" : ""}`}>
        <span>{charCount} / {maxLength} characters</span>
      </div>
    </div>
  );
}
