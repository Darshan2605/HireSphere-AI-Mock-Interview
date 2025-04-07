import React from "react";
import { Header } from "./_components/Header";

function DashboardLayout({ children }) {
  return (
    <div>
      <Header />
      <div className="mx-3 md:mx-10">{children}</div>
    </div>
  );
}

export default DashboardLayout;
