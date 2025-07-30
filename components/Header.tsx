'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { getImagePath } from '@/lib/config'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-5">
        <nav className="flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-4">
            <Image 
              src={getImagePath('/HeroLogo.png')}
              alt="UpgradeMate" 
              width={200} 
              height={40}
              className="h-10 w-auto"
            />
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/#features" className="text-gray-700 hover:text-blue-800 font-medium transition-colors">
              Features
            </Link>
            <Link href="/#for-users" className="text-gray-700 hover:text-blue-800 font-medium transition-colors">
              For Users
            </Link>
            <Link href="/#for-admins" className="text-gray-700 hover:text-blue-800 font-medium transition-colors">
              For IT Admins
            </Link>
            <Link href="/#pricing" className="text-gray-700 hover:text-blue-800 font-medium transition-colors">
              Pricing
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-800 font-medium transition-colors">
              Contact Sales
            </Link>
            <Link 
              href="/get-started" 
              className="bg-blue-800 text-white px-6 py-2.5 rounded-md hover:bg-blue-900 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg font-semibold"
            >
              Get Started
            </Link>
          </div>
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>
        
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <Link href="/#features" className="block py-2 text-gray-700 hover:text-blue-800">
              Features
            </Link>
            <Link href="/#for-users" className="block py-2 text-gray-700 hover:text-blue-800">
              For Users
            </Link>
            <Link href="/#for-admins" className="block py-2 text-gray-700 hover:text-blue-800">
              For IT Admins
            </Link>
            <Link href="/#pricing" className="block py-2 text-gray-700 hover:text-blue-800">
              Pricing
            </Link>
            <Link href="/contact" className="block py-2 text-gray-700 hover:text-blue-800">
              Contact Sales
            </Link>
            <Link 
              href="/get-started" 
              className="block mt-4 bg-blue-800 text-white px-4 py-2 rounded-md hover:bg-blue-900 transition-colors text-center"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}