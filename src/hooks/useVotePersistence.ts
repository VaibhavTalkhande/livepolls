import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Poll } from "@/types/poll";
import { useAuth } from "@/components/AuthProvider";

export function useVotePersistence(poll: Poll) {
  const [hasVoted, setHasVoted] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    const checkPreviousVote = async () => {
      if (!session?.user) return;

      try {
        console.log('Checking previous vote for:', {
          pollId: poll.id,
          userId: session.user.id
        });

        const { data, error } = await supabase
          .from('user_votes')
          .select('selected_options')
          .eq('question_id', poll.id)
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking previous vote:', error);
          return;
        }

        console.log('Previous vote data:', data);
        setHasVoted(!!data);

        // If there's a previous vote, update the local poll state
        if (data && poll.votes) {
          const currentVotes = { ...poll.votes };
          data.selected_options.forEach((optionIndex: number) => {
            if (!currentVotes[optionIndex]) {
              currentVotes[optionIndex] = {
                count: 1,
                users: [{
                  id: session.user.id,
                  email: session.user.email
                }]
              };
            }
          });
        }
      } catch (error) {
        console.error('Error in checkPreviousVote:', error);
      }
    };

    checkPreviousVote();
  }, [poll.id, session?.user]);

  return { hasVoted, setHasVoted };
}