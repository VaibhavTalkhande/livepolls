import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle, LogOut } from "lucide-react";
import { CreatePollForm } from "@/components/CreatePollForm";
import { PollItem } from "@/components/PollItem";
import { Poll, RawPoll } from "@/types/poll";
import { useAuth } from "@/components/AuthProvider";

export default function Index() {
  const [questions, setQuestions] = useState<Poll[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const { signOut, session } = useAuth();

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

    // Convert raw data to Poll type
    const convertedPolls: Poll[] = (data as RawPoll[]).map(rawPoll => ({
      ...rawPoll,
      options: rawPoll.options as string[],
      votes: rawPoll.votes as Record<string, number> | null
    }));

    setQuestions(convertedPolls);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
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
          <PollItem key={question.id} poll={question} />
        ))}
      </div>
    </div>
  );
}