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
    <div className="space-y-4">
      {poll.options.map((option: string, index: number) => (
        <div 
          key={index} 
          onClick={() => !hasVoted && !isVoting && handleVote(index)}
          className={`relative p-4 rounded-lg transition-all duration-200 overflow-hidden ${
            !hasVoted && !isVoting ? 'cursor-pointer hover:bg-blue-50' : ''
          } ${
            hasVoted && isCorrectAnswer(index) ? 'border-green-500' : 'border border-input'
          } ${
            poll.multiple_choice && selectedOptions.includes(index) ? 'bg-blue-50' : ''
          }`}
        >
          <div 
            className={`absolute inset-0 transition-all duration-500 ${
              hasVoted && isCorrectAnswer(index) ? 'bg-green-100' : 'bg-blue-100'
            }`}
            style={{
              width: hasVoted ? `${getVotePercentage(poll.votes, index)}%` : '0%'
            }}
          />
          
          <div className="relative flex justify-between items-center">
            <span className={`text-sm ${
              hasVoted && isCorrectAnswer(index) ? 'text-green-600 font-medium' : ''
            }`}>
              {option}
            </span>
            {hasVoted && (
              <span className="text-sm text-muted-foreground">
                {getVotePercentage(poll.votes, index).toFixed(1)}%
              </span>
            )}
          </div>
        </div>
      ))}

      <div className="mt-4 text-sm text-muted-foreground">
        Total votes: {getTotalVotes(poll.votes)}
        {hasVoted && (poll.correct_option !== null || poll.correct_options?.length > 0) && (
          <div className="mt-2 text-green-600">
            {poll.multiple_choice ? (
              <>Correct answers: {poll.correct_options?.map(i => poll.options[i]).join(", ")}</>
            ) : (
              <>Correct answer: {poll.options[poll.correct_option!]}</>
            )}
          </div>
        )}
      </div>
    </div>
  );
}