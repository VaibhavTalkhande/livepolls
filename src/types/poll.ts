import { Json } from "@/integrations/supabase/types";

export type PollVotes = Record<string, number>;

export type PollOption = string;

export type Poll = {
  id: number;
  question: string;
  options: PollOption[];
  correct_option: number;
  votes: PollVotes | null;
};

export type RawPoll = {
  id: number;
  question: string;
  options: Json;
  correct_option: number;
  votes: Json;
};