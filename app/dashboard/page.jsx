"use client";
import React from "react";
import AddNewInterview from "./_components/AddNewInterview";
import InterviewList from "./_components/InterviewList";

const Dashboard = () => {
  return (
    <div className="p-5 md:p-10 bg-white min-h-screen text-gray-800 rounded-xl shadow-lg">
      {/* Header Section */}
      <div className="text-center mb-10">
        <h2 className="font-extrabold text-3xl md:text-4xl dark-green-clr">
          AI Mock Interview Dashboard
        </h2>
        <h3 className="text-gray-600 mt-2 text-sm md:text-base">
          Create and Start Your AI-Powered Mock Interview
        </h3>
      </div>

      {/* Add New Interview Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="col-span-1 md:col-span-3 bg-gray-100 p-4 md:p-6 rounded-lg shadow-md">
          <AddNewInterview />
        </div>
      </div>

      {/* Previous Interviews Section */}
      <div className="bg-gray-100 p-4 md:p-6 rounded-lg shadow-lg">
        <h3 className="font-bold text-lg md:text-xl mb-4 text-blue-600">
          Previous Interviews
        </h3>
        <InterviewList />
      </div>
    </div>
  );
};

export default Dashboard;