import { Json } from "@/integrations/supabase/types";

export type PollVotes = Record<string, number>;

export type PollOption = string;

export type Poll = {
  id: number;
  question: string;
  options: PollOption[];
  correct_option: number | null;
  correct_options?: number[];
  multiple_choice?: boolean;
  votes: PollVotes | null;
};

export type RawPoll = {
  id: number;
  question: string;
  options: Json;
  correct_option: number | null;
  correct_options?: number[];
  multiple_choice?: boolean;
  votes: Json;
};