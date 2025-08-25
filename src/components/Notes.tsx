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
    <div className="notes-container">
      <div className="notes-toolbar">
        <button onClick={addNote} className="add-note-btn">
          + Add Note
        </button>
        {notes.length > 0 && (
          <button onClick={clearAllNotes} className="clear-all-btn">
            Clear All
          </button>
        )}
        <span className="notes-count">
          {notes.length} note{notes.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div ref={containerRef} className="notes-workspace">
        {notes.map((note) => (
          <div
            key={note.id}
            className="sticky-note"
            style={{
              position: "absolute",
              left: note.x,
              top: note.y,
              width: note.width,
              height: note.height,
              backgroundColor: note.color,
              zIndex: note.zIndex,
              border: "1px solid rgba(0,0,0,0.1)",
              borderRadius: "8px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
              cursor:
                dragState.isDragging && dragState.noteId === note.id
                  ? "grabbing"
                  : "grab",
              userSelect: "none",
              fontFamily: "Arial, sans-serif",
            }}
            onMouseDown={(e) => handleMouseDown(e, note.id)}
          >
            {/* Note Header */}
            <div
              className="note-header"
              style={{
                padding: "8px",
                borderBottom: "1px solid rgba(0,0,0,0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.05)",
                borderRadius: "8px 8px 0 0",
              }}
            >
              <div
                className="color-picker"
                style={{ display: "flex", gap: "2px" }}
              >
                {COLORS.slice(0, 4).map((color) => (
                  <div
                    key={color}
                    style={{
                      width: "12px",
                      height: "12px",
                      backgroundColor: color,
                      border:
                        note.color === color
                          ? "2px solid #333"
                          : "1px solid rgba(0,0,0,0.2)",
                      borderRadius: "50%",
                      cursor: "pointer",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateNoteColor(note.id, color);
                    }}
                  />
                ))}
              </div>
              <button
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "16px",
                  cursor: "pointer",
                  color: "#666",
                  padding: "0",
                  width: "20px",
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
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
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              color: "#666",
              fontSize: "18px",
            }}
          >
            <p>No notes yet!</p>
            <p style={{ fontSize: "14px", marginTop: "8px" }}>
              Click "Add Note" to create your first sticky note
            </p>
          </div>
        )}
      </div>

      <style>{`
        .notes-container {
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .notes-toolbar {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
          padding: 12px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .add-note-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .add-note-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .clear-all-btn {
          background: #ff6b6b;
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .clear-all-btn:hover {
          background: #ff5252;
        }

        .notes-count {
          color: #666;
          font-size: 14px;
          margin-left: auto;
        }

        .sticky-note:hover {
          box-shadow: 0 6px 12px rgba(0,0,0,0.2);
        }

        .notes-workspace {
          background-image: 
            radial-gradient(circle, #ddd 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
};

export default Notes;
