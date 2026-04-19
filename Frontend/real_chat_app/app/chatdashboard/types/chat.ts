export type Message = {
  id: number;
  sender: string;
  text: string;
  time: string;
};

export type Member = {
  name: string;
  avatar: string;
};

export type Room = {
  id: string;
  name: string;
  members: Member[];
};