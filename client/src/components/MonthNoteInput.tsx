import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";

interface MonthNoteInputProps {
  currentDate: Date;
  section: "habit" | "project";
}

async function fetchNote(month: string, section: string): Promise<string> {
  const res = await fetch(`/api/notes?month=${month}&section=${section}`);
  if (!res.ok) return "";
  const data = await res.json();
  return data.content ?? "";
}

async function saveNote(month: string, section: string, content: string): Promise<void> {
  await fetch("/api/notes", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ month, section, content }),
  });
}

export default function MonthNoteInput({ currentDate, section }: MonthNoteInputProps) {
  const month = format(currentDate, "yyyy-MM");
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLoaded(false);
    fetchNote(month, section).then((text) => {
      setContent(text);
      setLoaded(true);
    });
  }, [month, section]);

  // Auto-grow height to fit content
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [content]);

  const handleBlur = useCallback(() => {
    if (!loaded) return;
    saveNote(month, section, content);
  }, [month, section, content, loaded]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter alone blurs (saves); Shift+Enter inserts a newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      textareaRef.current?.blur();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={content}
      onChange={(e) => setContent(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={`Notes for ${section === "habit" ? "habits" : "projects"} this month…`}
      disabled={!loaded}
      rows={2}
      className="w-full mt-4 px-3 py-2 text-sm bg-transparent border border-zinc-700 rounded-md resize-none overflow-hidden text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-40 min-h-[60px]"
    />
  );
}
