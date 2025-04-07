"use client";
import { db } from "@/utils/db";
import { MockInterview } from "@/utils/schema";
import { eq } from "drizzle-orm";
import React, { useEffect, useState } from "react";
import QuestionsSection from "./_components/QuestionsSection";
import RecordAnswerSection from "./_components/RecordAnswerSection";
import EyePostureAnalysis from "./_components/EyePostureAnalysis";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const StartInterview = ({ params }) => {
  const [interViewData, setInterviewData] = useState();
  const [mockInterviewQuestion, setMockInterviewQuestion] = useState();
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [isInterviewEnded, setIsInterviewEnded] = useState(false); // Track if the interview has ended
  const [feedback, setFeedback] = useState({
    eyeContact: "Analyzing...",
    posture: "Analyzing...",
    peopleCount: 0,
    confidence: "N/A",
  });

  useEffect(() => {
    GetInterviewDetails();
  }, []);

  const GetInterviewDetails = async () => {
    const result = await db
      .select()
      .from(MockInterview)
      .where(eq(MockInterview.mockId, params.interviewId));
    const jsonMockResp = JSON.parse(result[0].jsonMockResp);
    setMockInterviewQuestion(jsonMockResp);
    setInterviewData(result[0]);
  };

  const handleEndInterview = () => {
    setIsInterviewEnded(true); // Set the interview as ended
  };

  return (
    <div className="my-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Questions Section */}
        <div className="flex flex-col gap-5">
          <QuestionsSection
            mockInterviewQuestion={mockInterviewQuestion}
            activeQuestionIndex={activeQuestionIndex}
          />

          {/* Record Answer Section */}
          <RecordAnswerSection
            mockInterviewQuestion={mockInterviewQuestion}
            activeQuestionIndex={activeQuestionIndex}
            interviewData={interViewData}
          />

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-5">
            {activeQuestionIndex > 0 && (
              <Button
                onClick={() => setActiveQuestionIndex(activeQuestionIndex - 1)}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg"
              >
                Previous Question
              </Button>
            )}
            {activeQuestionIndex !== mockInterviewQuestion?.length - 1 && (
              <Button
                onClick={() => setActiveQuestionIndex(activeQuestionIndex + 1)}
                className="bg-[#053603] dark-green-clr-bg text-white px-4 py-2 rounded-lg"
              >
                Next Question
              </Button>
            )}
            {activeQuestionIndex === mockInterviewQuestion?.length - 1 && (
              <Link
                href={`/dashboard/interview/${interViewData?.mockId}/feedback`}
                onClick={handleEndInterview} // Stop the video when ending the interview
              >
                <Button className="bg-green-500 text-white px-4 py-2 rounded-lg">
                  End Interview
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Video Frame and Feedback Section */}
        <div className="flex flex-col gap-5">
          <h3 className="font-bold text-xl mb-3">Eye Contact and Posture Analysis</h3>
          <EyePostureAnalysis
            setFeedback={setFeedback}
            isInterviewEnded={isInterviewEnded} // Pass the state to stop the video
            interviewData={interViewData}
          />
          <div className="feedback-window mt-5 p-4 bg-gray-100 rounded shadow">
            <h3 className="font-bold text-lg">Feedback</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>
                <strong>Eye Contact:</strong> {feedback.eyeContact}
              </p>
              <p>
                <strong>Posture:</strong> {feedback.posture}
              </p>
              <p>
                <strong>People Count:</strong> {feedback.peopleCount}
              </p>
              <p>
                <strong>Confidence Score:</strong> {feedback.confidence}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartInterview;