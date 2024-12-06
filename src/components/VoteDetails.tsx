import { Poll } from "@/types/poll";
import { User } from "lucide-react";

type VoteDetailsProps = {
  poll: Poll;
  hasVoted: boolean;
};

export function VoteDetails({ poll, hasVoted }: VoteDetailsProps) {
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="font-medium mb-2">Response Details</h3>
      <div className="space-y-4">
        {Object.entries(poll.votes || {}).map(([optionIndex, voteData]: [string, any]) => (
          <div key={optionIndex} className="space-y-2">
            <div className="flex justify-between font-medium">
              <span>{poll.options[parseInt(optionIndex)]}</span>
              <span>{voteData.count || 0} votes</span>
            </div>
            <div className="pl-4 space-y-1">
              {voteData.users?.map((user: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}