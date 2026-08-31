"use client";

import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export type Mentionable = { id: string; type: "user" | "crew"; name: string };

export function CommentComposer({
  action,
  mentionables,
}: {
  action: (formData: FormData) => void | Promise<void>;
  mentionables: Mentionable[];
}) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<Mentionable[]>([]);
  const [pending, setPending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value;
    setValue(text);
    const cursor = e.target.selectionStart;
    const upToCursor = text.slice(0, cursor);
    const match = upToCursor.match(/@([\w\s]{0,30})$/);
    if (match) {
      const query = match[1].trim().toLowerCase();
      setSuggestions(
        mentionables.filter((m) => m.name.toLowerCase().includes(query)).slice(0, 6)
      );
    } else {
      setSuggestions([]);
    }
  }

  function pick(m: Mentionable) {
    const el = textareaRef.current;
    const cursor = el?.selectionStart ?? value.length;
    const upToCursor = value.slice(0, cursor);
    const replaced = upToCursor.replace(/@([\w\s]{0,30})$/, `@${m.name} `);
    const newValue = replaced + value.slice(cursor);
    setValue(newValue);
    setSuggestions([]);
    el?.focus();
  }

  return (
    <form
      action={async (formData) => {
        setPending(true);
        try {
          await action(formData);
          setValue("");
        } finally {
          setPending(false);
        }
      }}
      className="space-y-2"
    >
      <div className="relative">
        <Textarea
          ref={textareaRef}
          name="body"
          value={value}
          onChange={handleChange}
          rows={3}
          placeholder="Add a comment… type @ to mention a person or crew"
          required
        />
        {suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-72 overflow-hidden rounded-md border border-[#E3DDD0] bg-white shadow-md">
            {suggestions.map((s) => (
              <button
                key={`${s.type}-${s.id}`}
                type="button"
                onClick={() => pick(s)}
                className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-[#16233A] hover:bg-[#FAF7F1]"
              >
                {s.name}
                <span className="text-xs text-[#8A93A3]">{s.type === "crew" ? "crew" : ""}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        Post comment
      </Button>
    </form>
  );
}
