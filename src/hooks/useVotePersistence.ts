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

      const { data } = await supabase
        .from('user_votes')
        .select('selected_options')
        .eq('question_id', poll.id)
        .eq('user_id', session.user.id)
        .single();

      if (data) {
        setHasVoted(true);
      }
    };

    checkPreviousVote();
  }, [poll.id, session?.user]);

  return { hasVoted, setHasVoted };
}