export type Message = {
  id: number;
  sender: string;
  content: string;
  time: string;
};

export type Member = {
  name: string;
  avatar: string;
};

export type Room = {
  id: number;
  name: string;
  members: Member[];
};