import Link from 'next/link'

export default function TransformCTA() {
  return (
    <section className="py-16 bg-upgrade-blue text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Windows Upgrades?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Stop dreading OS upgrades. Start delivering them smoothly.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/get-started" 
              className="bg-white text-upgrade-blue px-8 py-4 rounded-md hover:bg-gray-100 transition-colors font-semibold"
            >
              Get Started
            </Link>
            <Link 
              href="/get-started" 
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-md hover:bg-white hover:text-upgrade-blue transition-colors font-semibold"
            >
              Request Demo
            </Link>
            <Link 
              href="/contact" 
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-md hover:bg-white hover:text-upgrade-blue transition-colors font-semibold"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}