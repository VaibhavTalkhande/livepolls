import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function CreatePollForm({ onClose }: { onClose: () => void }) {
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState(["", ""]);
  const [correctOption, setCorrectOption] = useState(0);
  const { toast } = useToast();

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
    onClose();
    toast({
      title: "Success!",
      description: "Poll created successfully",
    });
  };

  return (
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
  );
}