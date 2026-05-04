"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Trash2, X, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Room } from "./types/chat";
import MessageInput from "./MessageInput";

type Props = {
  room: Room;
};

type UserCache = Record<number, string>;

export default function ChatWindow({ room }: Props) {
  const [messages, setMessages] = useState<any[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const [showMembers, setShowMembers] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  const [userCache, setUserCache] = useState<UserCache>({});
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  // ✅ Stable api instance — defined once with useRef so it never triggers re-renders
  const api = useRef(
    axios.create({
      baseURL: "http://localhost:8000",
      timeout: 8000,
    })
  ).current;

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  // =========================
  // GET CURRENT USER (/auth/me)
  // =========================
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get("/api/auth/me", {
          headers: getAuthHeaders(),
        });
        setCurrentUserId(res.data?.id ?? null);
        setCurrentUsername(res.data?.username ?? null);
      } catch {
        setCurrentUserId(null);
        setCurrentUsername(null);
      }
    };

    fetchMe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // USERNAME CACHE
  // ✅ userCache removed from deps — we use the functional setter instead
  // =========================
  const getUsernameById = useCallback(
    async (id: number): Promise<string> => {
      if (!id) return "Unknown";

      // Read from cache via ref-based lookup using setter trick
      return new Promise((resolve) => {
        setUserCache((prev) => {
          if (prev[id]) {
            resolve(prev[id]);
            return prev; // no state change
          }

          // Cache miss — fetch async, then update
          api
            .get(`/api/auth/getuser/${id}`, { headers: getAuthHeaders() })
            .then((res) => {
              const username = res.data?.username ?? "Unknown";
              setUserCache((p) => ({ ...p, [id]: username }));
              resolve(username);
            })
            .catch(() => resolve("Unknown"));

          return prev; // no state change while fetching
        });
      });
    },
    // ✅ api and getAuthHeaders are stable refs — safe deps
    [api, getAuthHeaders]
  );

  // =========================
  // FETCH MESSAGES
  // =========================
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        setError(null);
        const res = await api.get(`/api/chats/messages/${room.name}`, {
          headers: getAuthHeaders(),
        });

        const raw = Array.isArray(res.data) ? res.data : [];

        const enriched = await Promise.all(
          raw.map(async (msg: any) => {
            const senderId = Number(msg.sender_id);

            const username =
              senderId === currentUserId
                ? currentUsername
                : await getUsernameById(senderId);

            return {
              id: msg.id,
              sender_id: senderId,
              sender: username,
              content: msg.content ?? msg.text ?? "",
              created_at: msg.created_at ?? "",
            };
          })
        );

        setMessages(enriched);
      } catch {
        setError("Failed to load messages");
      } finally {
        setLoadingMessages(false);
      }
    };

    if (room?.name) fetchMessages();
  // ✅ getUsernameById is now stable so this won't loop
  }, [room, currentUserId, currentUsername, getUsernameById, api, getAuthHeaders]);

  // =========================
  // FETCH MEMBERS
  // =========================
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await api.get(`/api/chats/rooms/${room.name}`, {
          headers: getAuthHeaders(),
        });

        const ids: number[] = Array.isArray(res.data?.members)
          ? res.data.members
          : [];

        const names = await Promise.all(ids.map((id) => getUsernameById(id)));
        setMembers(names);
      } catch {
        setMembers([]);
      }
    };

    if (room?.name) fetchMembers();
  }, [room, getUsernameById, api, getAuthHeaders]);

  // =========================
  // REMOVE MEMBER
  // =========================
  const removeMember = async (usernameToRemove: string) => {
    try {
      await api.delete(
        `api/chats/rooms/${room.name}/members/${usernameToRemove}`,
        { headers: getAuthHeaders() }
      );
      setMembers((prev) => prev.filter((name) => name !== usernameToRemove));
    } catch (error: any) {
      console.error("Delete Error details:", error.response?.data);
      alert(error.response?.data?.detail || "Failed to remove member");
    }
  };

  // =========================
  // SEND MESSAGE
  // =========================
  const sendMessage = (text: string) => {
    const clean = text.trim();
    if (!clean) return;

    const newMsg = {
      id: Date.now(),
      sender_id: currentUserId,
      sender: currentUsername,
      content: clean,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);
  };

  // =========================
  // HELPERS
  // =========================
  const isMe = (msg: any) =>
    currentUserId !== null && Number(msg.sender_id) === Number(currentUserId);

  const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || "U";

  const formatTime = (t: string) => {
    if (!t) return "";
    const d = new Date(t);
    if (isNaN(d.getTime())) return t;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // =========================
  // UI
  // =========================
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-100 to-gray-200">

      {/* CHAT AREA */}
      <div className="flex flex-col flex-1">

        {/* HEADER */}
        <div className="flex justify-between items-center px-5 py-3 bg-white shadow-md border-b">
          <div>
            <h1 className="font-semibold text-lg">{room.name}</h1>
            <p className="text-xs text-gray-500">{members.length} members online</p>
          </div>

          <button onClick={() => setShowMembers(true)} className="flex -space-x-2">
            {members.slice(0, 3).map((m, i) => (
              <div
                key={i}
                className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold border-2 border-white"
              >
                {getInitial(m)}
              </div>
            ))}
          </button>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loadingMessages && (
            <p className="text-gray-400 text-sm">Loading...</p>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {messages.map((msg, i) => {
            const mine = isMe(msg);

            return (
              <div
                key={msg.id ?? i}
                className={`flex items-end gap-2 ${
                  mine ? "justify-end" : "justify-start"
                }`}
              >
                {/* AVATAR */}
                {!mine && (
                  <div className="w-9 h-9 rounded-full bg-gray-600 text-white flex items-center justify-center text-xs font-bold">
                    {getInitial(msg.sender)}
                  </div>
                )}

                {/* BUBBLE */}
                <div
                  className={`px-4 py-2 max-w-xs md:max-w-md rounded-2xl shadow-sm ${
                    mine
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-white border text-gray-800 rounded-bl-sm"
                  }`}
                >
                  {!mine && (
                    <p className="text-xs text-gray-500 mb-1">{msg.sender}</p>
                  )}

                  <p className="text-sm break-words whitespace-pre-wrap">
                    {msg.content}
                  </p>

                  <p className="text-[10px] mt-1 opacity-60">
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        <div className="border-t bg-white p-3 shadow-inner">
          <MessageInput onSend={sendMessage} name={room.name} />
        </div>
      </div>

      {/* MEMBERS SIDEBAR */}
      {showMembers && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setShowMembers(false)}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Sidebar Header */}
            <div className="p-6 border-b flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-gray-800 text-lg">Room Members</h2>
              </div>
              <button
                onClick={() => setShowMembers(false)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <AnimatePresence>
                {members.map((m) => (
                  <motion.div
                    key={m}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group flex items-center justify-between p-3 rounded-xl transition-all hover:bg-blue-50 hover:shadow-sm border border-transparent hover:border-blue-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-tr from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-inner">
                          {getInitial(m)}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-700 block">{m}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Member</span>
                      </div>
                    </div>

                    <button
                      onClick={() => removeMember(m)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t bg-gray-50 text-center">
              <p className="text-xs text-gray-400">Total Members: {members.length}</p>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}