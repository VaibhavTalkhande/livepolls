import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Poll } from "@/types/poll";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { VoteDetails } from "./VoteDetails";
import { PollOptions } from "./PollOptions";
import { useVotePersistence } from "@/hooks/useVotePersistence";
import { VoteHandler } from "./VoteHandler";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    const checkCreator = async () => {
      if (session?.user?.id === poll.creator_id) {
        setIsCreator(true);
      }
    };

    checkCreator();
  }, [session?.user?.id, poll.creator_id]);

  useEffect(() => {
    const checkPreviousVotes = async () => {
      if (!session?.user?.id) return;

      try {
        const { data: voteData, error } = await supabase
          .from('user_votes')
          .select('*')
          .eq('question_id', poll.id)
          .eq('user_id', session.user.id);

        // Check if we have any votes
        if (voteData && voteData.length > 0) {
          setHasVoted(true);
        }
      } catch (error) {
        console.error('Error checking previous votes:', error);
      }
    };

    checkPreviousVotes();
  }, [poll.id, session?.user?.id, setHasVoted]);

  return (
    <Card className="w-full p-4 md:p-6 animate-fade-in">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-lg md:text-xl font-semibold break-words">{poll.question}</h2>
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
      </div>
    </Card>
  );
}