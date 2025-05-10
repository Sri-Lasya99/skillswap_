import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import ReactStars from "react-rating-stars-component";
import { useToast } from "@/hooks/use-toast";

interface RateSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skillId: string;
  targetUserId: string;
}

const RateSkillDialog = ({ open, onOpenChange, skillId, targetUserId }: RateSkillDialogProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const submitRating = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/ratings", {
        rating,
        comment,
        skillId,
        targetUserId,
      });
    },
    onSuccess: () => {
      toast({ title: "Rating Submitted", description: "Thanks for your feedback!" });
      onOpenChange(false);
      setRating(0);
      setComment("");
    },
    onError: () => {
      toast({ title: "Error", description: "Could not submit rating", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass p-6 rounded-xl max-w-md">
        <DialogHeader>
          <DialogTitle>Rate This Exchange</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <ReactStars
            count={5}
            value={rating}
            onChange={setRating}
            size={30}
            activeColor="#ffd700"
          />
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Leave a comment (optional)"
            className="glass-input resize-none"
            rows={3}
          />
        </div>

        <DialogFooter className="pt-4">
          <Button onClick={() => onOpenChange(false)} variant="outline">Cancel</Button>
          <Button onClick={() => submitRating.mutate()} disabled={submitRating.isPending}>
            {submitRating.isPending ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RateSkillDialog;
