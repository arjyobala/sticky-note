import React, { useState, useRef, useEffect, useCallback } from "react";
import styles from "./notes.module.css";

interface Note {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  zIndex: number;
}

interface NotesProps {
  initialNotes?: Note[];
  onNotesChange?: (notes: Note[]) => void;
}

const COLORS = [
  "#FFE066", // Yellow
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#96CEB4", // Green
  "#FFEAA7", // Light Yellow
  "#DDA0DD", // Plum
  "#98D8C8", // Mint
];

const Notes: React.FC<NotesProps> = ({ initialNotes = [], onNotesChange }) => {
  const [notes, setNotes] = useState<Note[]>(() => {
    // Try to load from localStorage first, then use initialNotes
    const saved = localStorage.getItem("sticky-notes");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialNotes;
      }
    }
    return initialNotes;
  });

  const [maxZIndex, setMaxZIndex] = useState(100);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    noteId: string | null;
    offset: { x: number; y: number };
  }>({
    isDragging: false,
    noteId: null,
    offset: { x: 0, y: 0 },
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Save to localStorage whenever notes change
  useEffect(() => {
    localStorage.setItem("sticky-notes", JSON.stringify(notes));
    onNotesChange?.(notes);
  }, [notes, onNotesChange]);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.isDragging || !dragState.noteId) return;

      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const newX = e.clientX - containerRect.left - dragState.offset.x;
      const newY = e.clientY - containerRect.top - dragState.offset.y;

      setNotes((prev) =>
        prev.map((note) =>
          note.id === dragState.noteId
            ? { ...note, x: Math.max(0, newX), y: Math.max(0, newY) }
            : note
        )
      );
    },
    [dragState]
  );

  // Handle mouse up for dragging
  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      noteId: null,
      offset: { x: 0, y: 0 },
    });
  }, []);

  // Add event listeners for dragging
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  const addNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      content: "New note...",
      x: Math.random() * 300,
      y: Math.random() * 200,
      width: 200,
      height: 200,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      zIndex: maxZIndex + 1,
    };
    setNotes((prev) => [...prev, newNote]);
    setMaxZIndex((prev) => prev + 1);
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const updateNoteContent = (id: string, content: string) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, content } : note))
    );
  };

  const updateNoteColor = (id: string, color: string) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, color } : note))
    );
  };

  const bringToFront = (id: string) => {
    const newZIndex = maxZIndex + 1;
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, zIndex: newZIndex } : note
      )
    );
    setMaxZIndex(newZIndex);
  };

  const handleMouseDown = (e: React.MouseEvent, noteId: string) => {
    e.preventDefault();
    const noteElement = e.currentTarget as HTMLElement;
    const rect = noteElement.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (!containerRect) return;

    setDragState({
      isDragging: true,
      noteId,
      offset: {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      },
    });

    bringToFront(noteId);
  };

  const clearAllNotes = () => {
    setNotes([]);
  };

  return (
    <div className={styles.notesContainer}>
      <div className={styles.notesToolbar}>
        <button onClick={addNote} className={styles.addNoteBtn}>
          + Add Note
        </button>
        {notes.length > 0 && (
          <button onClick={clearAllNotes} className={styles.clearAllBtn}>
            Clear All
          </button>
        )}
        <span className={styles.notesCount}>
          {notes.length} note{notes.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div ref={containerRef} className={styles.notesWorkspace}>
        {notes.map((note) => (
          <div
            key={note.id}
            className={styles.stickyNote}
            style={{
              left: note.x,
              top: note.y,
              width: note.width,
              height: note.height,
              backgroundColor: note.color,
              zIndex: note.zIndex,
            }}
            onMouseDown={(e) => handleMouseDown(e, note.id)}
          >
            {/* Note Header */}
            <div className={styles.noteHeader}>
              <div className={styles.colorPicker}>
                {COLORS.slice(0, 4).map((color) => (
                  <div
                    key={color}
                    className={`${styles.colorDot} ${
                      note.color === color ? styles.selected : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateNoteColor(note.id, color);
                    }}
                  />
                ))}
              </div>
              <button
                className={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNote(note.id);
                }}
                title="Delete note"
              >
                ×
              </button>
            </div>

            {/* Note Content */}
            <textarea
              value={note.content}
              onChange={(e) => updateNoteContent(note.id, e.target.value)}
              className={styles.noteContent}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="Type your note here..."
            />
          </div>
        ))}

        {notes.length === 0 && (
          <div className={styles.emptyState}>
            <p>No notes yet!</p>
            <p className={styles.subtitle}>
              Click "Add Note" to create your first sticky note
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;
