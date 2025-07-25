import Image from 'next/image'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="bg-gradient-to-b from-blue-50 to-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Make Windows Upgrades<br />
              Actually Work
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              The smart add-on for ConfigMgr (SCCM) that turns<br />
              enterprise Windows OS upgrades from a nightmare<br />
              into a smooth ride.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/get-started" 
                className="bg-upgrade-blue text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors text-center"
              >
                Get Started
              </Link>
              <Link 
                href="#demo" 
                className="border border-upgrade-blue text-upgrade-blue px-6 py-3 rounded-md hover:bg-blue-50 transition-colors text-center"
              >
                Watch Demo
              </Link>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-upgrade-cyan rounded-lg p-8 flex items-center justify-center">
              <Image 
                src="/Logo_transparent.png" 
                alt="UpgradeMate" 
                width={400} 
                height={300}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}