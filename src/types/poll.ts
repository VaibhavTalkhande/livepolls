export type PollVotes = Record<string, number>;

export type PollOption = string;

export type Poll = {
  id: number;
  question: string;
  options: PollOption[];
  correct_option: number;
  votes: PollVotes;
};