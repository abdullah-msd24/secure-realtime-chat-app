"use client";

import { useState } from "react";
import { Room } from "./types/chat";

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
  rooms: Room[];
  setRooms: (rooms: Room[]) => void;
  activeRoomId: number;
  setActiveRoomId: (id: number) => void;
  setLoading: (loading: boolean) => void;
};

export default function Sidebar({
  rooms,
  setRooms,
  activeRoomId,
  setActiveRoomId,
  setLoading,
}: Props) {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState("");

  // 👇 member flow states
  const [addMembers, setAddMembers] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [askMore, setAskMore] = useState(false);

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (id: number) => {
    setLoading(true);

    setTimeout(() => {
      setActiveRoomId(id);
      setLoading(false);
    }, 300);
  };

  // 👉 ADD MEMBER LOGIC (UPDATED FLOW)
  const addMember = () => {
    if (!memberEmail.trim()) return;

    setMembers((prev) => [...prev, memberEmail]);
    setMemberEmail("");

    // 👇 after first add, ask user
    setAskMore(true);
  };

  // 👉 user decision: add more or not
  const handleAddMore = (choice: boolean) => {
    setAskMore(false);

    if (!choice) {
      setAddMembers(false);
    }
  };

  const handleCreateRoom = () => {
    if (!roomName.trim()) return;

    const newRoom: Room = {
      id: Date.now().toString(),
      name: roomName,
      members: members,
    };

    setLoading(true);

    setTimeout(async() => {
      setRooms([...rooms, newRoom]);
      setActiveRoomId(newRoom.id);
      
      const res = await axios.post('http://localhost:8000/api/chats/rooms',newRoom,{
        headers:{
          Authorization : `Bearer ${localStorage.getItem('authToken')}`
        }
      })
      
      
      

      // reset everything
      setRoomName("");
      setMembers([]);
      setMemberEmail("");
      setAddMembers(false);
      setAskMore(false);
      setShowCreate(false);

      setLoading(false);
    }, 300);
  };

  return (
    <div className="w-72 bg-white border-r p-4 flex flex-col">
      <h2 className="font-semibold mb-3">Rooms</h2>

      {/* CREATE DIALOG */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogTrigger asChild>
          <Button className="mb-3 w-full">+ Create Room</Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Room</DialogTitle>
          </DialogHeader>

          {/* ROOM NAME */}
          <Input
            placeholder="Enter room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />

          {/* ADD MEMBERS */}
          <div className="flex items-center gap-2 mt-3">
            <input
              type="checkbox"
              checked={addMembers}
              onChange={(e) => setAddMembers(e.target.checked)}
            />
            <span className="text-sm">
              Do you want to add members?
            </span>
          </div>

          {/* MEMBER INPUT */}
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

              {/* SHOW LIST */}
              <div className="text-xs text-gray-500">
                {members.map((m, i) => (
                  <div key={i}>• {m}</div>
                ))}
              </div>

              {/* ASK MORE UI */}
              {askMore && (
                <div className="flex gap-2 text-sm items-center">
                  <span>Do you want to add more?</span>
                  <Button
                    size="sm"
                    onClick={() => handleAddMore(true)}
                  >
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
            <Button
              variant="outline"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>

            <Button onClick={handleCreateRoom}>
              Create
            </Button>
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
        {filteredRooms.map((room) => (
          <div
            key={room.id}
            onClick={() => handleSelect(room.id)}
            className={`p-3 rounded cursor-pointer ${
              activeRoomId === room.id
                ? "bg-blue-100"
                : "hover:bg-gray-100"
            }`}
          >
            <p className="font-medium">{room.name}</p>
            <span className="text-xs text-gray-500">
              {room.members.length} members
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}