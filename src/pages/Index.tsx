import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle, LogOut } from "lucide-react";
import { CreatePollForm } from "@/components/CreatePollForm";
import { PollItem } from "@/components/PollItem";
import { Leaderboard } from "@/components/Leaderboard";
import { Poll, RawPoll, VoteData } from "@/types/poll";
import { useAuth } from "@/components/AuthProvider";

export default function Index() {
  const [questions, setQuestions] = useState<Poll[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const { signOut, session } = useAuth();

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

    const convertedPolls: Poll[] = (data as RawPoll[]).map(rawPoll => {
      const votes: Record<string, VoteData> = {};
      if (rawPoll.votes) {
        Object.entries(rawPoll.votes as Record<string, any>).forEach(([key, value]) => {
          if (typeof value === 'number') {
            votes[key] = {
              count: value,
              users: []
            };
          } else {
            votes[key] = value as VoteData;
          }
        });
      }

      return {
        ...rawPoll,
        options: rawPoll.options as string[],
        votes: votes
      };
    });

    setQuestions(convertedPolls);
  };

  useEffect(() => {
    fetchQuestions();

    const channel = supabase
      .channel('questions_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'questions'
        },
        () => {
          fetchQuestions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePollDelete = () => {
    fetchQuestions();
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Live Polls</h1>
              <p className="text-sm text-gray-600">Welcome, {session?.user?.email}</p>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => setShowForm(!showForm)}
                className="gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Create Poll
              </Button>
              <Button
                variant="outline"
                onClick={signOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          {showForm && (
            <CreatePollForm onClose={() => setShowForm(false)} />
          )}

          <div className="space-y-6">
            {questions.map((question) => (
              <PollItem 
                key={question.id} 
                poll={question}
                onDelete={handlePollDelete}
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-1">
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}
