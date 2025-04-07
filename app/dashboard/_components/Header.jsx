"use client";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";

export const Header = () => {
  const path = usePathname();

  useEffect(() => {
    console.log(path);
  });

  return (
    <div className="flex p-4 items-center justify-between shadow-md header">
      {/* Logo Section */}
      <Image
        src={"/HireSp.png"}
        alt="logo"
        width={100}
        height={50}
        style={{
          width: "auto",
          height: "auto",
          borderRadius: "10%",
        }}
      />

      {/* Navigation Links (Hidden on Mobile) */}
      <ul className="hidden md:flex gap-6">
        <li
          className={`hover:text-blue-400 hover:font-bold transition-all cursor-pointer ${
            path === "/dashboard" && "text-blue-500 font-bold"
          }`}
        >
          <Link href="/dashboard">Dashboard</Link>
        </li>
      </ul>

      {/* User Button (Larger for Better Visibility) */}
      <div className="flex items-center">
        <UserButton
          appearance={{
            elements: {
              rootBox: "w-12 h-12", // Increase size of the UserButton
              avatarBox: "w-12 h-12", // Increase avatar size
            },
          }}
        />
      </div>
    </div>
  );
};