"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import { rooms as initialRooms } from "./data/mockData";
import { Room } from "./types/chat";

export default function ChatLayout() {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [activeRoomId, setActiveRoomId] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  const activeRoom = rooms.find((r) => r.id === activeRoomId);

  if (!activeRoom) {
    return <div className="p-4">Room not found</div>;
  }

  return (
    <div className="flex h-full">
      <Sidebar
        rooms={rooms}
        setRooms={setRooms}
        activeRoomId={activeRoomId}
        setActiveRoomId={setActiveRoomId}
        setLoading={setLoading}
      />

      <div className="flex-1 flex flex-col">
        {loading ? (
          <div className="p-4 animate-pulse">Loading room...</div>
        ) : (
          <ChatWindow room={activeRoom} />
        )}
      </div>
    </div>
  );
}