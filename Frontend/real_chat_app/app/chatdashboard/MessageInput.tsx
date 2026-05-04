"use client";

import axios from "axios";
import { useState } from "react";

type Props = {
  onSend: (text: string) => void;
  name: string;
};

export default function MessageInput({ onSend, name }: Props) {
  const [text, setText] = useState<string>("");
  const [height, setHeight] = useState<number>(40);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!text.trim() || loading) return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No auth token found");
      return;
    }

    const payload = {
      name: name,
      message: text, // FIXED (was messsage)
    };

    try {
      setLoading(true);

      // optimistic UI update
      onSend(text);

      const response = await axios.post(
        "http://localhost:8000/api/chats/messages",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response?.data?.status === 200) {
        setText("");
        setHeight(40);
      } else {
        console.error("Message send failed:", response.data);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
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

    const newHeight = Math.min(e.target.scrollHeight, 120);
    setHeight(newHeight);
  };

  return (
    <div className="border-t bg-white p-4">
      <div className="flex items-end gap-2 bg-gray-100 rounded-2xl px-3 py-2 shadow-sm">

        <textarea
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          style={{ height: `${height}px` }}
          className="flex-1 resize-none bg-transparent outline-none text-sm overflow-hidden"
          disabled={loading}
        />

        <button
          onClick={handleSend}
          disabled={!text.trim() || loading}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            text.trim() && !loading
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}