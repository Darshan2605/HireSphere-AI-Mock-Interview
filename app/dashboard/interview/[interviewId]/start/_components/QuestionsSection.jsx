"use client";
import { Lightbulb, Volume2 } from "lucide-react";
import React from "react";

const QuestionsSection = ({ mockInterviewQuestion, activeQuestionIndex }) => {
  const textToSpeech = (text) => {
    if ("speechSynthesis" in window) {
      const speech = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(speech);
    } else {
      alert("Sorry, your browser does not support text-to-speech.");
    }
  };

  return (
    mockInterviewQuestion && (
      <div className="p-5 border rounded-lg my-10">
        {/* Question Headings */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {mockInterviewQuestion.map((question, index) => (
            <h2
              key={index}
              className={`p-3 rounded-lg text-xs md:text-sm text-center cursor-pointer transition-all duration-300 ${
                activeQuestionIndex === index
                  ? "bg-[#053603] dark-green-clr-bg text-white shadow-lg"
                  : "bg-[#2b8628] dark-green-clr-bg text-white hover:bg-[#1f671d] dark-green-clr-bg hover:text-white"
              }`}
              onClick={() => textToSpeech(question.question)}
            >
              Question #{index + 1}
            </h2>
          ))}
        </div>

        {/* Active Question */}
        <h2 className="my-5 text-md md:text-lg font-semibold">
          {mockInterviewQuestion[activeQuestionIndex]?.question}
        </h2>
        <Volume2
          className="cursor-pointer text-blue-700 hover:text-blue-900"
          onClick={() =>
            textToSpeech(mockInterviewQuestion[activeQuestionIndex]?.question)
          }
        />

        {/* Note Section */}
        <div className="border rounded-lg p-5 bg-[#053603] dark-green-clr-bg mt-10">
          <h2 className="flex gap-2 items-center text-white">
            <Lightbulb />
            <strong>Note:</strong>
          </h2>
          <h2 className="text-sm text-white my-2">
            {process.env.NEXT_PUBLIC_INFORMATION}
          </h2>
        </div>
      </div>
    )
  );
};

export default QuestionsSection;