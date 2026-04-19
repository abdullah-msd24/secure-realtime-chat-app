"use client";

import { useState } from "react";
import { Room, Message } from "./types/chat";
import MessageInput from "./MessageInput";

type Props = {
  room: Room;
};

export default function ChatWindow({ room }: Props) {
  // ✅ FIX: safe fallback for undefined messages
  const [messages, setMessages] = useState<Message[]>(
    room?.messages ?? []
  );

  const [showMembers, setShowMembers] = useState<boolean>(false);

  const sendMessage = (text: string) => {
    const newMsg: Message = {
      id: Date.now(),
      sender: "You",
      text,
      time: "Now",
    };

    setMessages((prev) => [...prev, newMsg]);
  };

  return (
    <div className="flex h-full relative bg-gray-50">
      {/* MAIN CHAT */}
      <div className="flex flex-col flex-1">
        {/* HEADER */}
        <div className="p-4 border-b bg-white flex items-center justify-between shadow-sm">
          <div>
            <h2 className="font-semibold text-lg">{room?.name}</h2>

            {/* ✅ FIX: safe members */}
            <p className="text-xs text-gray-500">
              {(room?.members ?? []).length} members
            </p>
          </div>

          {/* CLICKABLE AVATARS */}
          <div
            onClick={() => setShowMembers(true)}
            className="flex -space-x-2 cursor-pointer"
          >
            {/* ⚠️ SAFE MAP */}
            {(room?.members ?? []).slice(0, 3).map((m, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs"
              >
                {typeof m === "string" ? m[0] : "U"}
              </div>
            ))}
          </div>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => {
            const isMe = msg.sender === "You";

            return (
              <div
                key={msg.id}
                className={`flex ${
                  isMe ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                    isMe
                      ? "bg-blue-500 text-white rounded-br-sm"
                      : "bg-white text-gray-800 border rounded-bl-sm"
                  }`}
                >
                  {!isMe && (
                    <p className="text-xs font-semibold mb-1 text-gray-500">
                      {msg.sender}
                    </p>
                  )}

                  <p className="text-sm">{msg.text}</p>

                  <div
                    className={`text-[10px] mt-2 ${
                      isMe ? "text-blue-100" : "text-gray-400"
                    }`}
                  >
                    {msg.time}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* INPUT */}
        <div className="border-t bg-white p-4">
          <MessageInput onSend={sendMessage} />
        </div>
      </div>

      {/* MEMBER PANEL */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white border-l shadow-lg transform transition-transform duration-300 z-50 ${
          showMembers ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">Members</h3>
          <button onClick={() => setShowMembers(false)}>✕</button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          {(room?.members ?? []).map((member, index) => (
            <div
              key={index}
              className="p-2 rounded hover:bg-gray-100"
            >
              {/* ✅ FIX: works for string members */}
              <p className="text-sm font-medium">
                {typeof member === "string" ? member : "User"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* OVERLAY */}
      {showMembers && (
        <div
          onClick={() => setShowMembers(false)}
          className="fixed inset-0 bg-black/20 z-40"
        />
      )}
    </div>
  );
}