import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Poll } from "@/types/poll";
import { useState, useEffect } from "react";
import { Trash2, User } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { VoteDetails } from "./VoteDetails";
import { PollOptions } from "./PollOptions";

export function PollItem({ poll, onDelete }: { poll: Poll; onDelete?: () => void }) {
  const { toast } = useToast();
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [localPoll, setLocalPoll] = useState<Poll>(poll);
  const [isCreator, setIsCreator] = useState(false);
  const { session } = useAuth();

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

  const updateUserScore = async () => {
    const { data: existingScore } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', session?.user?.id)
      .single();

    if (existingScore) {
      await supabase
        .from('scores')
        .update({ score: existingScore.score + 1 })
        .eq('user_id', session?.user?.id);
    } else {
      await supabase
        .from('scores')
        .insert({
          user_id: session?.user?.id,
          score: 1,
          username: session?.user?.email?.split('@')[0] || 'Anonymous'
        });
    }
  };

  const handleVote = async (optionIndex: number) => {
    if (poll.multiple_choice) {
      setSelectedOptions(prev => 
        prev.includes(optionIndex) 
          ? prev.filter(i => i !== optionIndex)
          : [...prev, optionIndex]
      );
      return;
    }

    setIsVoting(true);
    const currentVotes = { ...localPoll.votes } || {};
    const updatedVotes = {
      ...currentVotes,
      [optionIndex]: {
        count: ((currentVotes[optionIndex]?.count || 0) + 1),
        users: [...(currentVotes[optionIndex]?.users || []), {
          id: session?.user?.id,
          email: session?.user?.email
        }]
      }
    };

    try {
      const { error } = await supabase
        .from('questions')
        .update({ votes: updatedVotes })
        .eq('id', poll.id);

      if (error) throw error;

      setLocalPoll(prev => ({
        ...prev,
        votes: updatedVotes
      }));
      setHasVoted(true);

      // Update score if answer is correct
      if (poll.correct_option === optionIndex) {
        await updateUserScore();
      }

      toast({
        title: "Vote submitted",
        description: "Your vote has been recorded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error voting",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
    }
  };

  const submitMultipleChoiceVote = async () => {
    if (selectedOptions.length === 0) {
      toast({
        title: "Invalid selection",
        description: "Please select at least one option",
        variant: "destructive",
      });
      return;
    }

    setIsVoting(true);
    const currentVotes = { ...localPoll.votes } || {};
    const updatedVotes = { ...currentVotes };
    
    selectedOptions.forEach(optionIndex => {
      updatedVotes[optionIndex] = {
        count: ((currentVotes[optionIndex]?.count || 0) + 1),
        users: [...(currentVotes[optionIndex]?.users || []), {
          id: session?.user?.id,
          email: session?.user?.email
        }]
      };
    });

    try {
      const { error } = await supabase
        .from('questions')
        .update({ votes: updatedVotes })
        .eq('id', poll.id);

      if (error) throw error;

      setLocalPoll(prev => ({
        ...prev,
        votes: updatedVotes
      }));
      setHasVoted(true);

      // Update score if all answers are correct
      const isCorrect = selectedOptions.every(option => 
        poll.correct_options?.includes(option)
      ) && selectedOptions.length === poll.correct_options?.length;

      if (isCorrect) {
        await updateUserScore();
      }

      toast({
        title: "Vote submitted",
        description: "Your votes have been recorded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error voting",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
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