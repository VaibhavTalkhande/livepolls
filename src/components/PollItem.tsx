import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Poll } from "@/types/poll";

export function PollItem({ poll }: { poll: Poll }) {
  const { toast } = useToast();

  const handleVote = async (optionIndex: number) => {
    const currentVotes = poll.votes || {};
    const updatedVotes = {
      ...currentVotes,
      [optionIndex]: (currentVotes[optionIndex] || 0) + 1
    };

    const { error } = await supabase
      .from('questions')
      .update({ votes: updatedVotes })
      .eq('id', poll.id);

    if (error) {
      toast({
        title: "Error voting",
        description: error.message,
        variant: "destructive",
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
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">{option}</span>
              <span className="text-sm text-muted-foreground">
                {getVotePercentage(poll.votes, index).toFixed(1)}%
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <Progress 
                value={getVotePercentage(poll.votes, index)} 
                className={`transition-all duration-500 ${
                  index === poll.correct_option ? 'bg-green-100' : ''
                }`}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleVote(index)}
              >
                Vote
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-sm text-muted-foreground">
        Total votes: {getTotalVotes(poll.votes)}
      </div>
    </Card>
  );
}