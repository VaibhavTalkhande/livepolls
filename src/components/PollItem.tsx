import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Poll } from "@/types/poll";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { VoteDetails } from "./VoteDetails";
import { PollOptions } from "./PollOptions";
import { useVotePersistence } from "@/hooks/useVotePersistence";
import { VoteHandler } from "./VoteHandler";

export function PollItem({ poll, onDelete }: { poll: Poll; onDelete?: () => void }) {
  const { toast } = useToast();
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
    if (session?.user) {
      setIsCreator(session.user.id === poll.creator_id);
    }
  }, [session, poll.creator_id]);

  const handleDelete = async () => {
    if (!session?.user) return;

    try {
      console.log('Starting deletion process for poll:', poll.id);
      
      const { error } = await supabase.rpc('delete_poll_with_votes', {
        poll_id: poll.id
      } as never); // Type assertion needed due to RPC typing limitations

      if (error) {
        console.error('Error in deletion transaction:', error);
        throw error;
      }

      console.log('Successfully deleted poll and related votes:', poll.id);

      toast({
        title: "Success",
        description: "Poll and related data deleted successfully",
      });

      if (onDelete) onDelete();
    } catch (error: any) {
      console.error('Error in deletion process:', error);
      toast({
        title: "Error deleting poll",
        description: error.message || "Failed to delete poll",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full p-4 md:p-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
        <h2 className="text-lg md:text-xl font-semibold">{poll.question}</h2>
        {isCreator && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
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