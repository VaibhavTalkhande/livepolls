import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type Score = {
  username: string;
  score: number;
};

export function Leaderboard() {
  const [scores, setScores] = useState<Score[]>([]);

  useEffect(() => {
    const fetchScores = async () => {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .order('score', { ascending: false })
        .limit(10);

      if (!error && data) {
        setScores(data);
      }
    };

    fetchScores();

    // Subscribe to changes
    const channel = supabase
      .channel('scores_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scores' },
        () => {
          fetchScores();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
      <div className="space-y-2">
        {scores.map((score, index) => (
          <div
            key={score.username}
            className="flex justify-between items-center p-2 rounded bg-gray-50"
          >
            <span className="flex items-center gap-2">
              <span className="font-medium">{index + 1}.</span>
              <span>{score.username}</span>
            </span>
            <span className="font-semibold">{score.score} points</span>
          </div>
        ))}
      </div>
    </Card>
  );
}