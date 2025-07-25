'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { getImagePath } from '@/lib/config'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src={getImagePath('/Logo01.png')}
              alt="UpgradeMate" 
              width={210} 
              height={56}
              className="h-14 w-auto"
            />
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-upgrade-blue">
              Home
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-upgrade-blue">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-upgrade-blue">
              Contact
            </Link>
            <Link 
              href="/get-started" 
              className="bg-upgrade-blue text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
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
            <Link href="/" className="block py-2 text-gray-700 hover:text-upgrade-blue">
              Home
            </Link>
            <Link href="/about" className="block py-2 text-gray-700 hover:text-upgrade-blue">
              About
            </Link>
            <Link href="/contact" className="block py-2 text-gray-700 hover:text-upgrade-blue">
              Contact
            </Link>
            <Link 
              href="/get-started" 
              className="block mt-4 bg-upgrade-blue text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-center"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}