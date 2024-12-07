import { Poll } from "@/types/poll";

type PollOptionsProps = {
  poll: Poll;
  hasVoted: boolean;
  isVoting: boolean;
  selectedOptions: number[];
  handleVote: (index: number) => void;
};

export function PollOptions({ poll, hasVoted, isVoting, selectedOptions, handleVote }: PollOptionsProps) {
  const getTotalVotes = (votes: Record<string, any> = {}) => {
    return Object.values(votes).reduce((sum, vote) => sum + (vote.count || 0), 0);
  };

  const getVotePercentage = (votes: Record<string, any> = {}, optionIndex: number) => {
    const total = getTotalVotes(votes);
    if (total === 0) return 0;
    return ((votes[optionIndex]?.count || 0) / total) * 100;
  };

  const isCorrectAnswer = (index: number) => {
    if (!poll.multiple_choice) {
      return poll.correct_option === index;
    }
    return poll.correct_options?.includes(index);
  };

  return (
    <div className="space-y-3 md:space-y-4 w-full">
      {poll.options.map((option: string, index: number) => (
        <div 
          key={index} 
          onClick={() => !hasVoted && !isVoting && handleVote(index)}
          className={`relative p-3 md:p-4 rounded-lg transition-all duration-200 overflow-hidden ${
            !hasVoted && !isVoting ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20' : ''
          } ${
            hasVoted && isCorrectAnswer(index) ? 'border-green-500' : 'border border-input'
          } ${
            poll.multiple_choice && selectedOptions.includes(index) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
          }`}
        >
          <div 
            className={`absolute inset-0 transition-all duration-500 ${
              hasVoted && isCorrectAnswer(index) ? 'bg-green-100 dark:bg-green-900/20' : 'bg-blue-100 dark:bg-blue-900/20'
            }`}
            style={{
              width: hasVoted ? `${getVotePercentage(poll.votes, index)}%` : '0%'
            }}
          />
          
          <div className="relative flex justify-between items-center flex-wrap gap-2">
            <span className={`text-sm md:text-base break-words ${
              hasVoted && isCorrectAnswer(index) ? 'text-green-600 dark:text-green-400 font-medium' : ''
            }`}>
              {option}
            </span>
            {hasVoted && (
              <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                {getVotePercentage(poll.votes, index).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      ))}

      <div className="mt-4 text-sm text-muted-foreground">
        <div className="flex flex-col md:flex-row gap-2 md:gap-4">
          <span>Total votes: {getTotalVotes(poll.votes)}</span>
          {hasVoted && (poll.correct_option !== null || poll.correct_options?.length > 0) && (
            <span className="text-green-600 dark:text-green-400">
              {poll.multiple_choice ? (
                <>Correct answers: {poll.correct_options?.map(i => poll.options[i]).join(", ")}</>
              ) : (
                <>Correct answer: {poll.options[poll.correct_option!]}</>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}