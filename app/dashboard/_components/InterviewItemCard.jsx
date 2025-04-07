import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import React from "react";

const InterviewItemCard = ({ interview }) => {
  const router = useRouter();
  const onStart = () => {
    router.push("/dashboard/interview/" + interview?.mockId);
  };
  const onFeedbackPress = () => {
    router.push("dashboard/interview/" + interview.mockId + "/feedback");
  };
  return (
    <div className="border shadow-sm rounded-lg p-4">
      <h2 className="font-bold text-primary text-base md:text-lg">
        {interview?.jobPosition}
      </h2>
      <h2 className="text-sm text-gray-500">{interview?.jobExperience}</h2>
      <h2 className="text-xs text-gray-400">
        Created At: {interview?.createdAt}
      </h2>
      <div className="flex flex-col md:flex-row justify-between gap-3 mt-4">
        <Button
          size="sm"
          variant="outline"
          className="w-full md:w-auto"
          onClick={onFeedbackPress}
        >
          Feedback
        </Button>
        <Button
          className="w-full md:w-auto dark-green-clr-bg bg-[#053603]"
          size="lg"
          onClick={onStart}
        >
          Start
        </Button>
      </div>
    </div>
  );
};

export default InterviewItemCard;