"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Room } from "./types/chat";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from "axios";

type Props = {
  rooms?: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  activeRoomId: number;
  setActiveRoomId: (id: number) => void;
  setLoading: (loading: boolean) => void;
};

export default function Sidebar({
  rooms = [],
  setRooms,
  activeRoomId,
  setActiveRoomId,
  setLoading,
}: Props) {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState("");

  const [addMembers, setAddMembers] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [askMore, setAskMore] = useState(false);

  // ✅ FILTER
  const filteredRooms = rooms.filter((room) =>
    room.name?.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ SELECT ROOM — always pass a number
  const handleSelect = (id: number) => {
    setLoading(true);
    setTimeout(() => {
      setActiveRoomId(id);
      setLoading(false);
    }, 300);
  };

  // ✅ ADD MEMBER
  const addMember = () => {
    if (!memberEmail.trim()) return;
    setMembers((prev) => [...prev, memberEmail]);
    setMemberEmail("");
    setAskMore(true);
  };

  const handleAddMore = (choice: boolean) => {
    setAskMore(false);
    if (!choice) setAddMembers(false);
  };

  // ✅ CREATE ROOM
  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;

    // Use a numeric id from the start to avoid string/number mismatch
    const tempId = Date.now();

    const newRoom: Room = {
      id: tempId,        // ← number, not string
      name: roomName,
      members: members,
    };

    try {
      setLoading(true);

      // ✅ Inside handleCreateRoom try block
const res = await axios.post(
  "http://localhost:8000/api/chats/rooms",
  newRoom,
  {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("authToken")}`,
    },
  }
);

// 1. Create a normalized object that matches your Room type
const normalizedRoom: Room = {
  ...res.data,
  id: res.data.room_id, // Map room_id from backend to id for frontend
};

// 2. Update state with the normalized object
setRooms((prev) => [...prev, normalizedRoom]);

// 3. Set active room using the correct key
setActiveRoomId(normalizedRoom.id);
      

    } catch (error) {
      console.error("Create room failed:", error);
    } finally {
      setRoomName("");
      setMembers([]);
      setMemberEmail("");
      setAddMembers(false);
      setAskMore(false);
      setShowCreate(false);
      setLoading(false);
    }
  };

  // ✅ DELETE ROOM
  const handleDelete = async (id: number) => {
    if (activeRoomId === id) {
      toast.error(
        "Cannot delete the active chat room. Please switch to another room first.",
        {
          style: { borderRadius: "10px", background: "#333", color: "#fff" },
        }
      );
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");

      await axios.delete(`http://localhost:8000/api/chats/rooms/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Room deleted successfully");
      setRooms((prev) => prev.filter((room) => Number(room.id) !== id));
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || "Failed to delete room";
      console.error("Delete failed:", error);
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-72 bg-white border-r p-4 flex flex-col">
      <h2 className="font-semibold mb-3">Rooms</h2>

      {/* CREATE ROOM */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogTrigger asChild>
          <Button className="mb-3 w-full">+ Create Room</Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Room</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Enter room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />

          <div className="flex items-center gap-2 mt-3">
            <input
              type="checkbox"
              checked={addMembers}
              onChange={(e) => setAddMembers(e.target.checked)}
            />
            <span className="text-sm">Add members?</span>
          </div>

          {addMembers && (
            <div className="mt-3 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                />
                <Button onClick={addMember}>Add</Button>
              </div>

              <div className="text-xs text-gray-500">
                {members.map((m, i) => (
                  <div key={i}>• {m}</div>
                ))}
              </div>

              {askMore && (
                <div className="flex gap-2 text-sm items-center">
                  <span>Add more?</span>
                  <Button size="sm" onClick={() => handleAddMore(true)}>
                    Yes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddMore(false)}
                  >
                    No
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRoom}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SEARCH */}
      <Input
        placeholder="Search rooms..."
        className="mb-4"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* ROOM LIST */}
      <div className="space-y-2 overflow-y-auto">
        {filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <p className="text-sm">No rooms found</p>
          </div>
        ) : (
          filteredRooms.map((room) => {
            // ✅ Normalize ONCE per iteration — fixes all comparisons below
            const roomId = Number(room.id);
            const isActive = activeRoomId === roomId;

            return (
              <div
                key={roomId}
                onClick={() => handleSelect(roomId)}
                className={`group flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200
                ${
                  isActive
                    ? "bg-blue-500 text-white shadow-md scale-[1.02]"
                    : "bg-white hover:bg-gray-50 shadow-sm"
                }`}
              >
                {/* Left */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold
                    ${
                      isActive
                        ? "bg-white text-blue-500"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {room.name.charAt(0).toUpperCase()}
                  </div>

                  <p className="font-medium text-sm">{room.name}</p>
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(roomId);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 rounded-md hover:bg-red-100"
                >
                  <Trash2 size={16} className="text-red-500" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}