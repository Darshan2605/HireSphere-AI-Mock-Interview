"use client";

import { db } from "@/utils/db";
import { UserAnswer, MockInterview } from "@/utils/schema";
import { eq } from "drizzle-orm";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import ReactSpeedometer from "react-d3-speedometer"; // ✅ Import Speedometer
import jsPDF from "jspdf"; // ✅ Import jsPDF for PDF generation
import html2canvas from "html2canvas"; // ✅ Capture page content for PDF

const Feedback = ({ params }) => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [filteredFeedbackList, setFilteredFeedbackList] = useState([]); // Exclude Behavioral Analysis
  const [overallRating, setOverallRating] = useState(0); // Overall rating out of 100
  const [behavioralFeedback, setBehavioralFeedback] = useState(null); // State for behavioral feedback
  const [userDetails, setUserDetails] = useState(null); // State for user's image and job details
  const router = useRouter();

  useEffect(() => {
    GetFeedback();
    GetUserDetails();
  }, []);

  const GetFeedback = async () => {
    const result = await db
      .select()
      .from(UserAnswer)
      .where(eq(UserAnswer.mockIdRef, params.interviewId))
      .orderBy(UserAnswer.id);

    console.log("🚀 ~ file: page.jsx:11 ~ GetFeedback ~ result:", result);

    // Extract behavioral feedback
    const behavioralData = result.find((item) => item.question === "Behavioral Analysis");
    if (behavioralData) {
      setBehavioralFeedback({
        rating: behavioralData.behavioralRating,
        feedback: JSON.parse(behavioralData.behavioralFeedback),
      });
    }

    // Filter out "Behavioral Analysis" from feedbackList
    const filteredList = result.filter((item) => item.question !== "Behavioral Analysis");
    setFilteredFeedbackList(filteredList);

    // Calculate overall rating
    const totalMarks = filteredList.reduce((sum, item) => sum + parseFloat(item.rating || 0), 0);
    const overallRating = totalMarks * 10; // Convert total marks to percentage
    setOverallRating(overallRating);

    setFeedbackList(result);
  };

  const GetUserDetails = async () => {
    const result = await db
      .select({
        capturedImage: MockInterview.capturedImage,
        jobPosition: MockInterview.jobPosition,
        jobDesc: MockInterview.jobDesc,
        jobExperience: MockInterview.jobExperience,
        createdBy: MockInterview.createdBy,
        createdAt: MockInterview.createdAt,
        mockId: MockInterview.mockId,
      })
      .from(MockInterview)
      .where(eq(MockInterview.mockId, params.interviewId));

    if (result.length > 0) {
      setUserDetails(result[0]);
    }
  };

  const downloadPDF = async (userDetails) => {
    if (!userDetails || !userDetails.mockId) {
      alert("Mock ID not found!");
      return;
    }
  
    const reportElement = document.getElementById("feedback-report");
  
    // 🔧 Reduce scale for smaller image size (1.5 instead of 3)
    const canvas = await html2canvas(reportElement, {
      scale: 1.5,
      useCORS: true, // Allow external assets
    });
  
    // ⚡ Convert to lower-quality image
    const imgData = canvas.toDataURL("image/jpeg", 0.5); // 50% JPEG compression
  
    // 📄 Smaller page size (A4)
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
  
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
    let position = 0;
    let heightLeft = imgHeight;
  
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pdfHeight;
  
    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pdfHeight;
    }
  
    const pdfData = pdf.output("datauristring").split(",")[1];
    const mockId = userDetails.mockId;
  
    try {
      const res = await fetch("/api/save-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfData, mockId }),
      });
  
      const { pdfBuffer, fileName, success } = await res.json();
  
      if (success) {
        alert("PDF saved successfully!");
  
        setTimeout(() => {
          sendEmail(mockId, pdfBuffer);
        }, 30000);
      } else {
        alert("Failed to save PDF.");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  
    pdf.save(`Interview_Feedback_Report_${mockId}.pdf`);
  };
  

  const sendEmail = async (mockId, pdfBuffer) => {
    if (!userDetails || !mockId || !pdfBuffer) {
      alert("Missing user details, Mock ID, or PDF data.");
      return;
    }

    const logoUrl = "https://hire-sphere-job-system-se48.vercel.app/HireSp.png";

    const emailBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
        <div style="text-align: center;">
          <img src="${logoUrl}" alt="HireSphere Logo" width="150" style="margin-bottom: 15px;" />
        </div>

        <p>Greetings from <b>HireSphere Team</b>,</p>
        <p>Please find attached the <b>Feedback Report</b> for your Mock Interview.</p>

        <hr style="border: 1px solid #ddd;" />
        <p><b>📌 Job Position:</b> ${userDetails.jobPosition}</p>
        <p><b>📌 Job Description:</b> ${userDetails.jobDesc}</p>
        <p><b>📌 Years of Experience:</b> ${userDetails.jobExperience}</p>
        <p><b>📌 Created By:</b> ${userDetails.createdBy}</p>

        <p>Your interview performance has been assessed, and detailed feedback is included in the attached report.</p>
        <p>Thank you for using <b>HireSphere's AI Mock Interview</b> platform. Keep improving, and all the best for your career ahead!</p>
        <p>Regards, <br/> <b>HireSphere Team</b></p>
      </div>
    `;

    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: userDetails.createdBy,
        subject: "Your Mock Interview Feedback Report",
        html: emailBody,
        mockId: mockId,
        pdfBufferBase64: pdfBuffer, // ✅ Now it's defined properly
      }),
    });

    const data = await response.json();
    console.log("Email Response:", data);

    if (data.success) {
      alert("Email Sent Successfully with PDF!");
    } else {
      alert(`Failed to send email: ${data.message}`);
    }
  };

  return (
    <>
      <div className="p-5 sm:p-10" id="feedback-report">
        <h2 className="text-2xl sm:text-3xl font-bold text-green-600 text-center">
          Congratulations!
        </h2>
        <h2 className="font-bold text-xl sm:text-2xl text-center">
          Here is your interview feedback
        </h2>

        {/* User Details Section */}
        {userDetails && (
          <div className="mt-5 p-5 border rounded-lg bg-gray-50 flex flex-col sm:flex-row gap-5 sm:gap-10 items-center">
            {userDetails.capturedImage && (
              <img
                src={userDetails.capturedImage}
                alt="User"
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover"
              />
            )}
            <div className="flex flex-col gap-2 text-center sm:text-left">
              <h3 className="font-bold text-lg">Job Details</h3>
              <p>
                <strong>Position:</strong> {userDetails.jobPosition}
              </p>
              <p>
                <strong>Description:</strong> {userDetails.jobDesc}
              </p>
              <p>
                <strong>Experience:</strong> {userDetails.jobExperience} years
              </p>
              <p>
                <strong>Created By:</strong> {userDetails.createdBy}
              </p>
              <p>
                <strong>Created At:</strong> {userDetails.createdAt}
              </p>
            </div>
          </div>
        )}

        {/* Behavioral Feedback Section */}
        {behavioralFeedback && (
          <div className="mt-5 p-5 border rounded-lg bg-gray-50">
            <h2 className="font-bold text-lg text-blue-600 text-center sm:text-left">
              <strong>Behavioral Analysis: </strong>
              {behavioralFeedback.rating}/100
            </h2>

            {/* ✅ Speedometer for Rating */}
            <div className="flex justify-center my-5">
              <ReactSpeedometer
                value={behavioralFeedback.rating}
                minValue={0}
                maxValue={100}
                segments={5}
                needleColor="black"
                startColor="red"
                endColor="green"
                textColor="black"
                height={200}
                width={300}
              />
            </div>

            <div className="mt-6 p-6 border rounded-lg shadow-md bg-white">
              <h3 className="font-bold text-lg text-blue-700 mb-3">
                💡 Suggestions:
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Eye Contact */}
                <div className="p-3 bg-gray-50 border rounded-lg shadow-sm">
                  <p className="font-semibold text-gray-800">👀 Eye Contact:</p>
                  <p className="text-gray-700">
                    {behavioralFeedback.feedback.eyeContact}
                  </p>
                </div>

                {/* Posture */}
                <div className="p-3 bg-gray-50 border rounded-lg shadow-sm">
                  <p className="font-semibold text-gray-800">🧍 Posture:</p>
                  <p className="text-gray-700">
                    {behavioralFeedback.feedback.posture}
                  </p>
                </div>

                {/* People Count (Spans full width) */}
                <div className="p-3 bg-gray-50 border rounded-lg shadow-sm col-span-1 sm:col-span-2">
                  <p className="font-semibold text-gray-800">👥 People Count:</p>
                  <p className="text-gray-700">
                    {behavioralFeedback.feedback.peopleCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* General Feedback Section */}
        <div className="mt-5 p-5 border rounded-lg bg-gray-50">
          <h2 className="font-bold text-lg text-blue-600 text-center sm:text-left">
            <strong>Mock Interview Rating:</strong> {overallRating}/100
          </h2>

          {/* Speedometer */}
          <div className="flex justify-center my-5">
            <ReactSpeedometer
              value={overallRating}
              minValue={0}
              maxValue={100}
              segments={5}
              needleColor="black"
              startColor="red"
              endColor="green"
              textColor="black"
              height={200}
              width={300}
            />
          </div>

          {/* Feedback List (All Sections Visible) */}
          {filteredFeedbackList.map((item, index) => (
            <div
              key={index}
              className={`mt-6 p-6 border rounded-lg shadow-md ${
                index % 2 === 0 ? "bg-blue-50" : "bg-gray-50"
              }`}
            >
              <h2 className="font-bold text-xl text-blue-700 mb-3">
                {item.question}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Rating */}
                <div className="p-3 bg-white border rounded-lg shadow-sm">
                  <p className="font-semibold text-gray-800">⭐ Rating:</p>
                  <p className="text-lg font-bold text-green-600">
                    {item.rating}
                  </p>
                </div>

                {/* Your Answer */}
                <div className="p-3 bg-white border rounded-lg shadow-sm">
                  <p className="font-semibold text-gray-800">📝 Your Answer:</p>
                  <p className="text-gray-700">{item.userAns}</p>
                </div>

                {/* Correct Answer */}
                <div className="p-3 bg-white border rounded-lg shadow-sm col-span-1 sm:col-span-2">
                  <p className="font-semibold text-gray-800">✅ Correct Answer:</p>
                  <p className="text-gray-700">{item.correctAns}</p>
                </div>

                {/* Feedback */}
                <div className="p-3 bg-white border rounded-lg shadow-sm col-span-1 sm:col-span-2">
                  <p className="font-semibold text-gray-800">💡 Feedback:</p>
                  <p className="text-gray-700">{item.feedback}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center items-center mb-5 gap-3">
        {/* ✅ Download PDF Button */}
        <Button
          className="mt-5 bg-green-600 text-white w-full sm:w-auto"
          onClick={() => downloadPDF(userDetails)}
        >
          Download PDF and Send Email
        </Button>

        {/* ✅ Go Home Button */}
        <Button
          className="mt-5 ml-0 sm:ml-3 w-full sm:w-auto"
          onClick={() => router.replace("/dashboard")}
        >
          Go Home
        </Button>
      </div>
    </>
  );
};

export default Feedback;