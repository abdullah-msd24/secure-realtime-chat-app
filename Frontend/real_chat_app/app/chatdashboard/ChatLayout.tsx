"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import { Room } from "./types/chat";

export default function ChatLayout() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/v1/getRooms", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });

        const data = await res.json();

        // 🔒 Safe extraction
        const fetchedRooms = Array.isArray(data?.rooms) ? data.rooms : [];

        setRooms(fetchedRooms);

        if (fetchedRooms.length > 0) {
          setActiveRoomId(fetchedRooms[0].id);
        }
      } catch (error) {
        console.error("Error fetching rooms:", error);
        setRooms([]); // fallback
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const activeRoom = rooms.find((r) => parseInt(r.id) === parseInt(activeRoomId));

  if (loading) {
    return <div className="p-4">Loading rooms...</div>;
  }

  return (
    <div className="flex h-full">
      <Sidebar
        rooms={rooms}
        setRooms={setRooms}
        activeRoomId={activeRoomId ?? 0}
        setActiveRoomId={setActiveRoomId}
        setLoading={setLoading}
      />

      <div className="flex-1 flex flex-col">
        {rooms.length === 0 ? (
          <div className="p-4 text-gray-500">
            No rooms yet. Create one 🚀
          </div>
        ) : !activeRoom ? (
          <div className="p-4">Select a room</div>
        ) : (
          <ChatWindow room={activeRoom} />
        )}
      </div>
    </div>
  );
}