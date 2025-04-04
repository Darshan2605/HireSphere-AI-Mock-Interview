// feedbackUtils.js
import { chatSession } from "@/utils/GeminiAIModal";

export const aggregateFeedback = (feedbackHistory,extraCounts = {}) => {
    const totalFeedback = feedbackHistory.length;
  
    const eyeContactGood = feedbackHistory.filter(fb => fb.eyeContact === "Maintaining Eye Contact").length;
    const postureGood = feedbackHistory.filter(fb => fb.posture === "Head Aligned").length;
    const goodPeopleCount = feedbackHistory.filter(fb => fb.peopleCount === 1).length;
  
    const eyeContactScore = (eyeContactGood / totalFeedback) * 100;
    const postureScore = (postureGood / totalFeedback) * 100;
    const peopleCountScore = (goodPeopleCount / totalFeedback) * 100;
  
    const overallScore = (eyeContactScore + postureScore + peopleCountScore) / 3;
  
    return {
      eyeContactScore,
      postureScore,
      peopleCountScore,
      overallScore,
      ...extraCounts  // include the additional counts
    };
  };
  
  export const generatePrompt = (aggregatedFeedback) => {
    const {
      eyeContactScore,
      postureScore,
      peopleCountScore,
      overallScore,
      lookingAwayCount,
      headTurnedCount,
      headTiltedCount,
      maxPeopleDetected,
    } = aggregatedFeedback;
  
    return `
      Based on the behavioral analysis during the interview, the candidate scored as follows:
  
      - **Eye Contact**: ${eyeContactScore.toFixed(2)} out of 100
        - Good: Maintaining Eye Contact
        - Bad: Looking Away
        - Looking Away Count: ${lookingAwayCount}
  
      - **Posture**: ${postureScore.toFixed(2)} out of 100
        - Good: Head Aligned
        - Medium: Head Tilted
        - Bad: Head Turned
        - Head Tilted Count: ${headTiltedCount}
        - Head Turned Count: ${headTurnedCount}
  
      - **People Count**: ${peopleCountScore.toFixed(2)} out of 100
        - Good: Only 1 person detected
        - Bad: More than 1 person detected
        - Maximum People Detected at Once: ${maxPeopleDetected}
  
      - **Overall Behavioral Score**: ${overallScore.toFixed(2)} out of 100
  
      Please provide a final behavioral analysis rating out of 100 and suggestions for improvement in the following JSON format:
      {
        "rating": <rating_out_of_100>,
        "suggestions": {
          "eyeContact": "<suggestions_for_improving_eye_contact>",
          "posture": "<suggestions_for_improving_posture>",
          "peopleCount": "<suggestions_for_improving_engagement>"
        }
      }
  
      Ensure the suggestions cover the following points:
      - Include numerics of headTiltedCount,maxPeopleDetected,headTurnedCount,lookingAwayCount.
      - If maxPeopleDetected is more than 1, Decrease Rating even more and suggest ways to improve engagement with the interviewer.
      - Eye Contact: Address maintaining eye contact and avoiding looking away.
      - Posture: Discuss aligning the head, avoiding tilting or turning, and maintaining good posture.
      - People Count: Suggest ways to engage better with the interviewer and avoid distractions from multiple people.
      - Keep it Short but Accurate/Concise.
    `;
  };
  
  
  export const getBehavioralAnalysis = async (aggregatedFeedback) => {
    const prompt = generatePrompt(aggregatedFeedback);
    const result = await chatSession.sendMessage(prompt);
  
    const responseText = result.response.text();
  
    // Log the raw response for debugging
    console.log("Raw Response Text:", responseText);
  
    try {
      // Extract the JSON part from the response
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}') + 1;
      const jsonResponse = responseText.slice(jsonStart, jsonEnd);
  
      // Log the extracted JSON for verification
      console.log("Extracted JSON Response:", jsonResponse);
  
      // Parse the JSON response
      const feedbackResponse = JSON.parse(jsonResponse);
  
      return {
        rating: feedbackResponse.rating,
        suggestions: feedbackResponse.suggestions,
      };
    } catch (error) {
      // Handle parsing errors
      console.error("Error parsing JSON response:", error);
      return {
        rating: null,
        suggestions: "Error processing feedback. Please try again.",
      };
    }
  };
  
  