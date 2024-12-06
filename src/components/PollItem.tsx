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
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', poll.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Poll deleted successfully",
      });

      if (onDelete) onDelete();
    } catch (error: any) {
      toast({
        title: "Error deleting poll",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card key={poll.id} className="p-6 animate-fade-in">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold">{poll.question}</h2>
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