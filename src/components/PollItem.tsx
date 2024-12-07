import { Card } from "@/components/ui/card";
import { Poll } from "@/types/poll";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { VoteDetails } from "./VoteDetails";
import { PollOptions } from "./PollOptions";
import { useVotePersistence } from "@/hooks/useVotePersistence";
import { VoteHandler } from "./VoteHandler";

export function PollItem({ poll }: { poll: Poll }) {
  const [localPoll, setLocalPoll] = useState<Poll>(poll);
  const [isCreator, setIsCreator] = useState(false);
  const { session } = useAuth();
  const { hasVoted, setHasVoted, selectedOptions: persistedOptions } = useVotePersistence(poll);
  const { selectedOptions, isVoting, handleVote, submitMultipleChoiceVote } = VoteHandler({
    poll: localPoll,
    initialSelectedOptions: persistedOptions,
    onVoteSubmitted: (updatedVotes) => {
      setLocalPoll(prev => ({
        ...prev,
        votes: updatedVotes
      }));
    },
    setHasVoted
  });

  return (
    <Card className="w-full p-4 md:p-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
        <h2 className="text-lg md:text-xl font-semibold">{poll.question}</h2>
      </div>

      <PollOptions
        poll={localPoll}
        hasVoted={hasVoted}
        isVoting={isVoting}
        selectedOptions={selectedOptions}
        handleVote={handleVote}
      />

      {poll.multiple_choice && !hasVoted && (
        <div className="mt-4">
          <Button 
            onClick={submitMultipleChoiceVote}
            disabled={isVoting}
            className="w-full md:w-auto"
          >
            Submit Votes
          </Button>
        </div>
      )}

      {isCreator && (
        <VoteDetails poll={localPoll} hasVoted={hasVoted} />
      )}
    </Card>
  );
}