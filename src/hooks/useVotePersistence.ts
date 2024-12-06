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
      } catch (error) {
        console.error('Error in checkPreviousVote:', error);
      }
    };

    checkPreviousVote();
  }, [poll.id, session?.user]);

  return { hasVoted, setHasVoted };
}