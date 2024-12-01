import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { PlusCircle } from "lucide-react";

type Question = Database["public"]["Tables"]["questions"]["Row"];

export default function Index() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", ""]);
  const [correctOption, setCorrectOption] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch initial questions
    fetchQuestions();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('questions_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'questions'
        },
        (payload) => {
          console.log('Change received!', payload);
          fetchQuestions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchQuestions = async () => {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      toast({
        title: "Error fetching questions",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setQuestions(data || []);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newOptions.some(opt => !opt.trim())) {
      toast({
        title: "Invalid options",
        description: "All options must have content",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('questions')
      .insert({
        question: newQuestion,
        options: newOptions,
        correct_option: correctOption,
        votes: {}
      });

    if (error) {
      toast({
        title: "Error creating poll",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setNewQuestion("");
    setNewOptions(["", ""]);
    setCorrectOption(0);
    setShowForm(false);
    toast({
      title: "Success!",
      description: "Poll created successfully",
    });
  };

  const handleVote = async (questionId: number, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const currentVotes = question.votes || {};
    const updatedVotes = {
      ...currentVotes,
      [optionIndex]: (currentVotes[optionIndex] || 0) + 1
    };

    const { error } = await supabase
      .from('questions')
      .update({ votes: updatedVotes })
      .eq('id', questionId);

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
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Live Polls</h1>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          Create Poll
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-8 animate-fade-in">
          <form onSubmit={handleCreatePoll} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Question</label>
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Options</label>
              {newOptions.map((option, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const updated = [...newOptions];
                      updated[index] = e.target.value;
                      setNewOptions(updated);
                    }}
                    className="w-full p-2 border rounded-md"
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  <input
                    type="radio"
                    name="correctOption"
                    checked={correctOption === index}
                    onChange={() => setCorrectOption(index)}
                    className="mt-3"
                  />
                </div>
              ))}
              {newOptions.length < 4 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNewOptions([...newOptions, ""])}
                  className="mt-2"
                >
                  Add Option
                </Button>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="submit">Create Poll</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-6">
        {questions.map((question) => (
          <Card key={question.id} className="p-6 animate-fade-in">
            <h2 className="text-xl font-semibold mb-4">{question.question}</h2>
            <div className="space-y-4">
              {question.options.map((option: string, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{option}</span>
                    <span className="text-sm text-muted-foreground">
                      {getVotePercentage(question.votes, index).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Progress 
                      value={getVotePercentage(question.votes, index)} 
                      className={`transition-all duration-500 ${
                        index === question.correct_option ? 'bg-green-100' : ''
                      }`}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVote(question.id, index)}
                    >
                      Vote
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Total votes: {getTotalVotes(question.votes)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}