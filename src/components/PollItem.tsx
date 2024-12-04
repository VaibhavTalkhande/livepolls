import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Poll } from "@/types/poll";
import { useState } from "react";

export function PollItem({ poll }: { poll: Poll }) {
  const { toast } = useToast();
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = async (optionIndex: number) => {
    setIsVoting(true);
    const currentVotes = poll.votes || {};
    const updatedVotes = {
      ...currentVotes,
      [optionIndex]: (currentVotes[optionIndex] || 0) + 1
    };

    const { error } = await supabase
      .from('questions')
      .update({ votes: updatedVotes })
      .eq('id', poll.id);

    setIsVoting(false);
    setHasVoted(true);

    if (error) {
      toast({
        title: "Error voting",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Vote submitted",
        description: "Your vote has been recorded successfully.",
      });
    }
  };

  const getTotalVotes = (votes: Record<string, number> = {}) => {
    return Object.values(votes).reduce((sum, count) => sum + count, 0);
  };

  const getVotePercentage = (votes: Record<string, number> = {}, optionIndex: number) => {
    const total = getTotalVotes(votes);
    if (total === 0) return 0;
    return ((votes[optionIndex] || 0) / total) * 100;
  };

  return (
    <Card key={poll.id} className="p-6 animate-fade-in">
      <h2 className="text-xl font-semibold mb-4">{poll.question}</h2>
      <div className="space-y-4">
        {poll.options.map((option: string, index: number) => (
          <div 
            key={index} 
            onClick={() => !hasVoted && !isVoting && handleVote(index)}
            className={`relative p-4 rounded-lg transition-all duration-200 overflow-hidden ${
              !hasVoted && !isVoting ? 'cursor-pointer hover:bg-accent/50' : ''
            } ${
              index === poll.correct_option && (hasVoted || poll.votes) 
                ? 'border-green-500' 
                : 'border border-input'
            }`}
          >
            {/* Background progress bar */}
            <div 
              className={`absolute inset-0 transition-all duration-500 ${
                index === poll.correct_option ? 'bg-green-100' : 'bg-accent'
              }`}
              style={{
                width: (hasVoted || poll.votes) ? `${getVotePercentage(poll.votes, index)}%` : '0%'
              }}
            />
            
            {/* Content */}
            <div className="relative flex justify-between items-center">
              <span className={`text-sm ${
                index === poll.correct_option && (hasVoted || poll.votes) 
                  ? 'text-green-600 font-medium' 
                  : ''
              }`}>
                {option}
              </span>
              {(hasVoted || poll.votes) && (
                <span className="text-sm text-muted-foreground">
                  {getVotePercentage(poll.votes, index).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-sm text-muted-foreground">
        Total votes: {getTotalVotes(poll.votes)}
        {(hasVoted || poll.votes) && poll.correct_option !== undefined && (
          <div className="mt-2 text-green-600">
            Correct answer: {poll.options[poll.correct_option]}
          </div>
        )}
      </div>
    </Card>
  );
}