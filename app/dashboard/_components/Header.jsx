"use client"
import { UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect } from 'react'

export const Header = () => {
    const path = usePathname()
    useEffect(() => {
        console.log(path);
    })
    return (
        <div className='flex p-4 items-center justify-between bg-secondary shadow-sm'>
            <Image src={'/HireSp.png'} alt='logo' width={100} height={50} style={{ width: "auto", height: "auto", borderRadius: "10%" }} />
            <ul className='hidden md:flex gap-6'>
                <li className={`hover:text-primary hover:font-bold transition-all cursor-pointer ${path == '/dashboard' && 'text-green-900 font-bold'}`}>
                    <Link href="/dashboard">Dashboard</Link>
                </li>
            </ul>
            <UserButton />
        </div>
    )
}