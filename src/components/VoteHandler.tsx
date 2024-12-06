import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Poll } from "@/types/poll";
import { useAuth } from "@/components/AuthProvider";

type VoteHandlerProps = {
  poll: Poll;
  initialSelectedOptions?: number[];
  onVoteSubmitted: (updatedVotes: any) => void;
  setHasVoted: (value: boolean) => void;
};

export function VoteHandler({ poll, initialSelectedOptions = [], onVoteSubmitted, setHasVoted }: VoteHandlerProps) {
  const [selectedOptions, setSelectedOptions] = useState<number[]>(initialSelectedOptions);
  const [isVoting, setIsVoting] = useState(false);
  const { toast } = useToast();
  const { session } = useAuth();

  const updateUserScore = async () => {
    if (!session?.user?.id) return;

    try {
      const { data: existingScore, error: fetchError } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingScore) {
        const { error: updateError } = await supabase
          .from('scores')
          .update({ score: existingScore.score + 1 })
          .eq('user_id', session.user.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('scores')
          .insert({
            user_id: session.user.id,
            score: 1,
            username: session.user.email?.split('@')[0] || 'Anonymous'
          });

        if (insertError) throw insertError;
      }
    } catch (error: any) {
      console.error('Error updating score:', error);
    }
  };

  const handleVote = async (optionIndex: number) => {
    if (!session?.user) return;

    if (poll.multiple_choice) {
      setSelectedOptions(prev => 
        prev.includes(optionIndex) 
          ? prev.filter(i => i !== optionIndex)
          : [...prev, optionIndex]
      );
      return;
    }

    setIsVoting(true);
    const currentVotes = poll.votes || {};
    const updatedVotes = {
      ...currentVotes,
      [optionIndex]: {
        count: (currentVotes[optionIndex]?.count || 0) + 1,
        users: [...(currentVotes[optionIndex]?.users || []), {
          id: session.user.id,
          email: session.user.email
        }]
      }
    };

    try {
      const [updateResult, voteResult] = await Promise.all([
        supabase
          .from('questions')
          .update({ votes: updatedVotes })
          .eq('id', poll.id),
        supabase
          .from('user_votes')
          .insert({
            user_id: session.user.id,
            question_id: poll.id,
            selected_options: [optionIndex]
          })
      ]);

      if (updateResult.error) throw updateResult.error;
      if (voteResult.error) throw voteResult.error;

      onVoteSubmitted(updatedVotes);
      setHasVoted(true);

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
    if (!session?.user) return;
    
    if (selectedOptions.length === 0) {
      toast({
        title: "Invalid selection",
        description: "Please select at least one option",
        variant: "destructive",
      });
      return;
    }

    setIsVoting(true);
    const currentVotes = poll.votes || {};
    const updatedVotes = { ...currentVotes };
    
    selectedOptions.forEach(optionIndex => {
      updatedVotes[optionIndex] = {
        count: (currentVotes[optionIndex]?.count || 0) + 1,
        users: [...(currentVotes[optionIndex]?.users || []), {
          id: session.user.id,
          email: session.user.email
        }]
      };
    });

    try {
      const [updateResult, voteResult] = await Promise.all([
        supabase
          .from('questions')
          .update({ votes: updatedVotes })
          .eq('id', poll.id),
        supabase
          .from('user_votes')
          .insert({
            user_id: session.user.id,
            question_id: poll.id,
            selected_options: selectedOptions
          })
      ]);

      if (updateResult.error) throw updateResult.error;
      if (voteResult.error) throw voteResult.error;

      onVoteSubmitted(updatedVotes);
      setHasVoted(true);

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

  return {
    selectedOptions,
    isVoting,
    handleVote,
    submitMultipleChoiceVote
  };
}