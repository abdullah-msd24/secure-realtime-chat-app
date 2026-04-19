import { Room } from "@/app/chatdashboard/types/chat";

export const rooms: Room[] = [
  {
    id: 1,
    name: "General",
    members: [
      { name: "Ali", avatar: "https://i.pravatar.cc/150?img=1" },
      { name: "Sara", avatar: "https://i.pravatar.cc/150?img=2" },
    ],
    messages: [
      {
        id: 1,
        sender: "Ali",
        text: "Welcome to General",
        time: "10:00 AM",
      },
    ],
  },
  {
    id: 2,
    name: "Dev Team",
    members: [
      { name: "Hassan", avatar: "https://i.pravatar.cc/150?img=3" },
    ],
    messages: [
      {
        id: 1,
        sender: "Hassan",
        text: "Backend ready",
        time: "9:00 AM",
      },
    ],
  },
];