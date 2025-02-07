"use client"
import { UserButton, useUser } from '@clerk/nextjs';
import { Layers } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'
import React, { useEffect } from 'react'
import { checkAndAddUser } from '../actions';

export const Navbar = () => {
    const pathname = usePathname();
    //use user de clerck pour recuperer les info de l'utilisateur
    const {user} = useUser();
    const navLinks =[
        {
            href:"/",
            label:"Factures"
        }
    ];

    useEffect(()=>{
        if(user?.primaryEmailAddress?.emailAddress && user?.fullName){
            checkAndAddUser(user?.primaryEmailAddress?.emailAddress,user?.fullName)
        }
    }, [user])

    //verifier le lien active
    const isActiveLink = (href:string) => pathname.replace(/\/$/, "") ===  href.replace(/\/$/, "");

    // retourne les liens 
    const renderLinks = (classNames:string) => 
        navLinks.map(({href, label}) =>{
            return <Link href={href} key={href} 
                    className={`btn-sm  ${classNames} ${isActiveLink(href)? 'btn-accent': ''}`}
                    >
                        {label}
                    </Link>
        })
    

    return (
        <div className='border-b border-base-300 px-5 md:px-[10%] py-4'>
            <div className='flex justify-between items-center'>
                <div className='flex items-center'>
                    <div className="bg-accent-content text-accent rounded-full p-2">
                        <Layers  className=''/>
                    </div>
                        <span className='ml-3 font-bold text-2xl italic'>In<span className='text-accent'>Voice</span></span> 
                </div>
               
                <div className='flex space-x-4 items-center'>
                    {renderLinks("btn")}
                    <UserButton/>
                </div>
            </div>
            <div></div>
        </div>
    )
}

export default Navbar
