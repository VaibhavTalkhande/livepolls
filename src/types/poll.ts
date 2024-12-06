import { Json } from "@/integrations/supabase/types";

export type VoteUser = {
  id: string | undefined;
  email: string | undefined;
};

export type VoteData = {
  count: number;
  users: VoteUser[];
};

export type PollVotes = Record<string, VoteData>;

export type PollOption = string;

export type Poll = {
  id: number;
  question: string;
  options: PollOption[];
  correct_option: number | null;
  correct_options?: number[];
  multiple_choice?: boolean;
  votes: PollVotes | null;
  creator_id: string | null;
};

export type RawPoll = {
  id: number;
  question: string;
  options: Json;
  correct_option: number | null;
  correct_options?: number[];
  multiple_choice?: boolean;
  votes: Json;
  creator_id: string | null;
};