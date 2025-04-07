'use client';

import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { Mic, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { chatSession } from "@/utils/GeminiAIModal";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import moment from "moment";

const RecordAnswerSection = ({
  mockInterviewQuestion,
  activeQuestionIndex,
  interviewData,
}) => {
  const [loading, setLoading] = useState(false);
  const answerRef = useRef('');
  const { user } = useUser();

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const StartStopRecording = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      const finalAnswer = transcript.trim();
      console.log("📝 Final Answer:", finalAnswer);

      if (finalAnswer.length < 10) {
        toast.error("⚠️ Answer too short. Please record again.");
        resetTranscript();
        return;
      }

      answerRef.current = finalAnswer;
      UpdateUserAnswer(finalAnswer);
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  const UpdateUserAnswer = async (userAnswer) => {
    setLoading(true);

    const feedbackPrompt =
      `Question: ${mockInterviewQuestion[activeQuestionIndex]?.question}, ` +
      `User Answer: ${userAnswer}, ` +
      `Based on the question and answer, provide a short 3-5 line JSON with fields: rating and feedback (areas of improvement).`;

    try {
      const result = await chatSession.sendMessage(feedbackPrompt);
      const responseText = await result.response.text();

      const mockJsonResp = responseText
        .replace("```json", "")
        .replace("```", "")
        .trim();

      const JsonfeedbackResp = JSON.parse(mockJsonResp);

      const resp = await db.insert(UserAnswer).values({
        mockIdRef: interviewData?.mockId,
        question: mockInterviewQuestion[activeQuestionIndex]?.question,
        correctAns: mockInterviewQuestion[activeQuestionIndex]?.answer,
        userAns: userAnswer,
        feedback: JsonfeedbackResp?.feedback,
        rating: JsonfeedbackResp?.rating,
        userEmail: user?.primaryEmailAddress?.emailAddress,
        createdAt: moment().format("DD-MM-YYYY"),
      });

      if (resp) {
        toast.success("✅ Answer recorded successfully!");
        resetTranscript();
      }
    } catch (error) {
      console.error("❌ Error:", error);
      toast.error("❌ Failed to save answer.");
    } finally {
      setLoading(false);
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return <p className="text-red-500 font-semibold">⚠️ Your browser does not support speech recognition.</p>;
  }

  return (
    <div className="flex justify-center items-center flex-col">
      

      <Button
        disabled={loading}
        variant="outline"
        className="my-10"
        onClick={StartStopRecording}
      >
        {listening ? (
          <h2 className="text-red-600 items-center animate-pulse flex gap-2">
            <StopCircle /> Stop Recording...
          </h2>
        ) : (
          <h2 className="text-primary flex gap-2 items-center">
            <Mic /> Record Answer
          </h2>
        )}
      </Button>

      <div className="w-full max-w-2xl px-4 mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">📝 Live Transcript:</h3>
        <div className="bg-gray-100 p-4 rounded-lg min-h-[100px] text-gray-700 whitespace-pre-wrap">
          {transcript}
        </div>
      </div>
    </div>
  );
};

export default RecordAnswerSection;
