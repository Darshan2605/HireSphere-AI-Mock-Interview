import React, { useEffect, useRef, useState } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import { aggregateFeedback, getBehavioralAnalysis } from './feedbackUtils';
import { db } from '@/utils/db';
import { UserAnswer } from '@/utils/schema';
import { useUser } from "@clerk/nextjs";
import { eq, and } from "drizzle-orm";
import moment from "moment";

const EyePostureAnalysis = ({ setFeedback, isInterviewEnded, interviewData }) => {
  const videoRef = useRef(null);

  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [currentFeedback, setCurrentFeedback] = useState({
    eyeContact: "Analyzing...",
    posture: "Analyzing...",
    peopleCount: 0,
    confidence: "N/A",
  });

  const [maxPeopleDetected, setMaxPeopleDetected] = useState(0);
  const [lookingAwayCount, setLookingAwayCount] = useState(0);
  const [headTurnedCount, setHeadTurnedCount] = useState(0);
  const [headTiltedCount, setHeadTiltedCount] = useState(0);

  const { user } = useUser();

  useEffect(() => {
    let detector;
    let interval;

    const setupDetector = async () => {
      await tf.setBackend("webgl");
      await tf.ready();

      detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
        modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
      });

      const video = videoRef.current;
      if (video) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          video.srcObject = stream;
          video.play();

          const captureFeedback = async () => {
            if (detector && video.readyState === 4 && !isInterviewEnded) {
              const poses = await detector.estimatePoses(video, { maxPoses: 5 });
              const peopleCount = poses.length;

              // 🔢 Update max people detected
              setMaxPeopleDetected((prev) => Math.max(prev, peopleCount));

              let eyeContact = "Analyzing...";
              let posture = "Analyzing...";

              if (peopleCount === 1) {
                const pose = poses[0];

                const leftEye = pose.keypoints.find((kp) => kp.name === "left_eye");
                const rightEye = pose.keypoints.find((kp) => kp.name === "right_eye");
                const nose = pose.keypoints.find((kp) => kp.name === "nose");

                if (leftEye && rightEye && nose) {
                  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
                  const eyeCenterY = (leftEye.y + rightEye.y) / 2;
                  const distanceToNose = Math.sqrt(
                    Math.pow(eyeCenterX - nose.x, 2) + Math.pow(eyeCenterY - nose.y, 2)
                  );
                  eyeContact = distanceToNose < 50 ? "Maintaining Eye Contact" : "Looking Away";

                  // 👀 Count "Looking Away"
                  if (eyeContact === "Looking Away") {
                    setLookingAwayCount((prev) => prev + 1);
                  }
                }

                const leftEar = pose.keypoints.find((kp) => kp.name === "left_ear");
                const rightEar = pose.keypoints.find((kp) => kp.name === "right_ear");

                if (leftEar && rightEar && nose) {
                  const headTilt = Math.abs(leftEar.y - rightEar.y);
                  const headTurn = Math.abs(nose.x - (leftEar.x + rightEar.x) / 2);
                  posture = headTilt > 20 ? "Head Tilted" : headTurn > 30 ? "Head Turned" : "Head Aligned";

                  // 🙆 Count postures
                  if (posture === "Head Tilted") setHeadTiltedCount((prev) => prev + 1);
                  else if (posture === "Head Turned") setHeadTurnedCount((prev) => prev + 1);
                }
              }

              const confidence = calculateConfidenceScore(eyeContact, posture, peopleCount);

              const feedback = {
                eyeContact,
                posture,
                peopleCount,
                confidence,
                timestamp: new Date().toISOString(),
              };

              setCurrentFeedback(feedback);
              setFeedbackHistory((prev) => [...prev, feedback]);
            }
          };

          captureFeedback();
          interval = setInterval(captureFeedback, 5000);
        } catch (error) {
          console.error("Error accessing the camera:", error);
        }
      }
    };

    setupDetector();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
      clearInterval(interval);
    };
  }, [setFeedback, isInterviewEnded]);

  useEffect(() => {
    setFeedback(currentFeedback);
  }, [currentFeedback, setFeedback]);

  useEffect(() => {
    if (isInterviewEnded && interviewData) {
      const aggregatedFeedback = aggregateFeedback(feedbackHistory,{ headTiltedCount: Math.floor(headTiltedCount / 2),
        headTurnedCount: Math.floor(headTurnedCount / 2),
        lookingAwayCount: Math.floor(lookingAwayCount / 2),
        maxPeopleDetected,});
      getBehavioralAnalysis(aggregatedFeedback).then(async (result) => {
        console.log("Final Behavioral Analysis:", result);

        if (interviewData?.mockId) {
          try {
            const existingRecord = await db.query.UserAnswer.findFirst({
              where: (userAnswer, { eq, and }) =>
                and(
                  eq(userAnswer.mockIdRef, interviewData.mockId),
                  eq(userAnswer.userEmail, user?.primaryEmailAddress?.emailAddress),
                  eq(userAnswer.question, "Behavioral Analysis")
                ),
            });

            if (existingRecord) {
              await db.update(UserAnswer)
                .set({
                  feedback: JSON.stringify(result.suggestions),
                  rating: result.rating.toString(),
                  behavioralRating: result.rating.toString(),
                  behavioralFeedback: JSON.stringify(result.suggestions),
                  createdAt: moment().format("YYYY-MM-DD"),
                })
                .where(and(
                  eq(UserAnswer.mockIdRef, interviewData.mockId),
                  eq(UserAnswer.userEmail, user?.primaryEmailAddress?.emailAddress),
                  eq(UserAnswer.question, "Behavioral Analysis")
                ));
            } else {
              await db.insert(UserAnswer).values({
                mockIdRef: interviewData.mockId,
                question: "Behavioral Analysis",
                feedback: JSON.stringify(result.suggestions),
                rating: result.rating.toString(),
                behavioralRating: result.rating.toString(),
                behavioralFeedback: JSON.stringify(result.suggestions),
                userEmail: user?.primaryEmailAddress?.emailAddress,
                createdAt: moment().format("YYYY-MM-DD"),
              });
            }
          } catch (error) {
            console.error("Error updating/creating UserAnswer:", error);
          }
        } else {
          console.error("mockId is undefined. Cannot insert behavioral analysis results.");
        }
      });
    }
  }, [isInterviewEnded, feedbackHistory, interviewData, user]);

  const calculateConfidenceScore = (eyeContact, posture, peopleCount) => {
    if (peopleCount === 0) return "0.00";

    let score = 100;

    if (eyeContact === "Looking Away") score -= 20;
    if (posture === "Head Turned") score -= 30;
    else if (posture === "Head Tilted") score -= 15;

    if (peopleCount === 2 || peopleCount === 3) score -= 30;
    else if (peopleCount >= 4) score -= 40;

    return Math.max(0, score).toFixed(2);
  };

  return (
    <div className="relative">
      <video ref={videoRef} className="w-full h-auto rounded-lg" autoPlay muted playsInline></video>

      <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm space-y-2">
        <p><strong>Eye Contact:</strong> {currentFeedback.eyeContact}</p>
        <p><strong>Posture:</strong> {currentFeedback.posture}</p>
        <p><strong>People Count:</strong> {currentFeedback.peopleCount}</p>
        <p><strong>Confidence Score:</strong> {currentFeedback.confidence}</p>
        <p><strong>📊 Max People Detected:</strong> {maxPeopleDetected}</p>
        <p><strong>🙈 Looking Away Count:</strong> {Math.ceil(lookingAwayCount / 2)} </p>
        <p><strong>↩️ Head Turned Count:</strong> {Math.ceil(headTurnedCount / 2)}</p>
        <p><strong>🔄 Head Tilted Count:</strong> {Math.ceil(headTiltedCount / 2)}</p>
      </div>
    </div>
  );
};

export default EyePostureAnalysis;
