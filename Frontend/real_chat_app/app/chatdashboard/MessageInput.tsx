"use client";

import { useState } from "react";

type Props = {
  onSend: (text: string) => void;
};

export default function MessageInput({ onSend }: Props) {
  const [text, setText] = useState<string>("");
  const [height, setHeight] = useState<number>(40); // default height

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
    setHeight(40); 
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);

    // Auto grow based on scrollHeight (state-driven)
    const newHeight = Math.min(e.target.scrollHeight, 120);
    setHeight(newHeight);
  };

  return (
    <div className="border-t bg-white p-4">
      <div className="flex items-end gap-2 bg-gray-100 rounded-2xl px-3 py-2 shadow-sm">

        {/* TEXTAREA */}
        <textarea
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          style={{ height: `${height}px` }}
          className="flex-1 resize-none bg-transparent outline-none text-sm overflow-hidden"
        />

        {/* SEND BUTTON */}
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            text.trim()
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
}