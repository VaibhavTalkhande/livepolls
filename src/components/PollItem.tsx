import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Poll } from "@/types/poll";
import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

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

  const handleVote = async (optionIndex: number) => {
    if (poll.multiple_choice) {
      // Toggle selection for multiple choice
      setSelectedOptions(prev => 
        prev.includes(optionIndex) 
          ? prev.filter(i => i !== optionIndex)
          : [...prev, optionIndex]
      );
      return;
    }

    setIsVoting(true);
    const currentVotes = localPoll.votes || {};
    const updatedVotes = {
      ...currentVotes,
      [optionIndex]: (currentVotes[optionIndex] || 0) + 1
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
    const currentVotes = localPoll.votes || {};
    const updatedVotes = { ...currentVotes };
    
    selectedOptions.forEach(optionIndex => {
      updatedVotes[optionIndex] = (updatedVotes[optionIndex] || 0) + 1;
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

  const getTotalVotes = (votes: Record<string, number> = {}) => {
    return Object.values(votes).reduce((sum, count) => sum + count, 0);
  };

  const getVotePercentage = (votes: Record<string, number> = {}, optionIndex: number) => {
    const total = getTotalVotes(votes);
    if (total === 0) return 0;
    return ((votes[optionIndex] || 0) / total) * 100;
  };

  const isCorrectAnswer = (index: number) => {
    if (!poll.multiple_choice) {
      return poll.correct_option === index;
    }
    return poll.correct_options?.includes(index);
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

      <div className="space-y-4">
        {poll.options.map((option: string, index: number) => (
          <div 
            key={index} 
            onClick={() => !hasVoted && !isVoting && handleVote(index)}
            className={`relative p-4 rounded-lg transition-all duration-200 overflow-hidden ${
              !hasVoted && !isVoting ? 'cursor-pointer hover:bg-blue-50' : ''
            } ${
              isCorrectAnswer(index) && (hasVoted || localPoll.votes) 
                ? 'border-green-500' 
                : 'border border-input'
            }`}
          >
            <div 
              className={`absolute inset-0 transition-all duration-500 ${
                isCorrectAnswer(index) ? 'bg-green-100' : 'bg-blue-100'
              }`}
              style={{
                width: (hasVoted || localPoll.votes) ? `${getVotePercentage(localPoll.votes, index)}%` : '0%'
              }}
            />
            
            <div className="relative flex justify-between items-center">
              <span className={`text-sm ${
                isCorrectAnswer(index) && (hasVoted || localPoll.votes) 
                  ? 'text-green-600 font-medium' 
                  : ''
              }`}>
                {option}
              </span>
              {(hasVoted || localPoll.votes) && (
                <span className="text-sm text-muted-foreground">
                  {getVotePercentage(localPoll.votes, index).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

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

      <div className="mt-4 text-sm text-muted-foreground">
        Total votes: {getTotalVotes(localPoll.votes)}
        {(hasVoted || localPoll.votes) && (poll.correct_option !== null || poll.correct_options?.length > 0) && (
          <div className="mt-2 text-green-600">
            {poll.multiple_choice ? (
              <>Correct answers: {poll.correct_options?.map(i => poll.options[i]).join(", ")}</>
            ) : (
              <>Correct answer: {poll.options[poll.correct_option!]}</>
            )}
          </div>
        )}
      </div>

      {isCreator && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Response Details</h3>
          <div className="space-y-2">
            {Object.entries(localPoll.votes || {}).map(([optionIndex, votes]) => (
              <div key={optionIndex} className="flex justify-between">
                <span>{poll.options[parseInt(optionIndex)]}</span>
                <span>{votes} votes</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
