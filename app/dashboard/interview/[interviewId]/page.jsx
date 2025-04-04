"use client";
import { Button } from "@/components/ui/button";
import { db } from "@/utils/db";
import { MockInterview } from "@/utils/schema";
import { eq } from "drizzle-orm";
import { Lightbulb } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState, useRef } from "react";
import Webcam from "react-webcam";
import { useUser } from "@clerk/nextjs";

function Interview({ params }) {
  const [interviewData, setInterviewData] = useState();
  const [webCamEnabled, setWebCamEnabled] = useState(false);
  const webcamRef = useRef(null);
  const { user } = useUser(); // Get the authenticated user

  useEffect(() => {
    GetInterviewDetails();
  }, []);

  const GetInterviewDetails = async () => {
    const result = await db
      .select()
      .from(MockInterview)
      .where(eq(MockInterview.mockId, params.interviewId));
    setInterviewData(result[0]);
  };

  const captureImage = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot(); // Capture the image as a base64 string

      // Update the MockInterview table with the captured image
      await db
        .update(MockInterview)
        .set({ capturedImage: imageSrc }) // Update the capturedImage field
        .where(eq(MockInterview.mockId, params.interviewId)); // Match the current mockId

      alert("Image captured and stored successfully!");

      // Refresh the interview data to include the captured image
      GetInterviewDetails();
    }
  };

  return (
    <div className="my-10">
      <h2 className="font-bold text-2xl mb-5">Let's get started</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="flex flex-col my-5 gap-5">
          <div className="flex flex-col p-5 rounded-lg border gap-5">
            <h2 className="text-lg">
              <strong>Job Role/Job Position: </strong>
              {interviewData?.jobPosition}
            </h2>
            <h2 className="text-lg">
              <strong>Job Description/Tech Stack: </strong>
              {interviewData?.jobDesc}
            </h2>
            <h2 className="text-lg">
              <strong>Years of Experience: </strong>
              {interviewData?.jobExperience}
            </h2>
          </div>
          <div className="p-5 border rounded-lg border-yellow-300 bg-yellow-100">
            <h2 className="flex gap-2 items-center text-yellow-500">
              <Lightbulb />
              <span>Information</span>
            </h2>
            <h2 className="mt-3 text-yellow-500">
              {process.env.NEXT_PUBLIC_INFORMATION}
            </h2>
          </div>
        </div>

        {/* Webcam Section */}
        <div className="flex flex-col items-center gap-5">
          {webCamEnabled && (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="rounded-lg border"
            />
          )}
          <Button
            onClick={() => setWebCamEnabled(!webCamEnabled)}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            {webCamEnabled ? "Disable Webcam" : "Enable Webcam"}
          </Button>
          {webCamEnabled && (
            <Button
              onClick={captureImage}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            >
              Capture Image
            </Button>
          )}
        </div>
      </div>

      {/* Display Captured Image */}
      {interviewData?.capturedImage && (
        <div className="mt-10 flex flex-col items-center">
          <h3 className="font-bold text-lg mb-3">Captured Image:</h3>
          <img
            src={interviewData.capturedImage}
            alt="Captured"
            className="rounded-lg border shadow-md"
            style={{ width: "300px", height: "auto" }}
          />
        </div>
      )}

      {/* Start Interview Button */}
      <div className="mt-10 flex justify-center">
        <Link href={`/dashboard/interview/${params.interviewId}/start`}>
          <Button className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-green-600">
            Start Interview
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default Interview;