"use client";
import React, { useState } from "react";
import AddNewInterview from "./_components/AddNewInterview";
import InterviewList from "./_components/InterviewList";


const Dashboard = () => {
  
  

  return (
    <div className="p-10">
      {/* Header Section */}
      <h2 className="font-bold text-2xl">Dashboard</h2>
      <h3 className="text-gray-500">Create and Start Your AI Mock Interview</h3>

      {/* Add New Interview Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 my-5">
        <AddNewInterview />
      </div>

     

      {/* Previous Interviews Section */}
      <InterviewList />

      
    </div>
  );
};

export default Dashboard;
