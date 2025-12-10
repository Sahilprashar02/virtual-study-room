import React, { useState, useEffect, useRef } from 'react';

const DocumentEditor = ({ socket, roomId, initialContent = '' }) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for document updates from other users
    socket.on('document-update', ({ content }) => {
      setContent(content);
    });

    return () => {
      socket.off('document-update');
    };
  }, [socket]);

  useEffect(() => {
    // Set initial content
    if (initialContent) {
      setContent(initialContent);
    }
  }, [initialContent]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Emit update to other users
    if (socket) {
      socket.emit('document-update', {
        roomId,
        content: newContent,
      });
    }

    // Debounced auto-save
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveDocument(newContent);
    }, 2000);
  };

  const saveDocument = (contentToSave) => {
    if (!socket) return;

    setIsSaving(true);
    socket.emit('document-save', {
      roomId,
      content: contentToSave,
    });

    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900/50">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Shared Notes</h3>
        <span className="text-sm text-gray-400">
          {isSaving ? '💾 Saving...' : '✓ Saved'}
        </span>
      </div>

      <div className="flex-1 p-4">
        <textarea
          className="w-full h-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-white resize-none focus:outline-none focus:border-indigo-500"
          placeholder="Start typing your notes here... Changes are synced in real-time!"
          value={content}
          onChange={handleContentChange}
        />
      </div>

      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          💡 All changes are automatically saved and synced with other participants
        </p>
      </div>
    </div>
  );
};

export default DocumentEditor;
