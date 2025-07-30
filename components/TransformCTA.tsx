import Link from 'next/link'

export default function TransformCTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-800 to-blue-900 text-white text-center">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Windows Upgrades?
          </h2>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Stop dreading OS upgrades. Start delivering them smoothly.
          </p>
          
          <Link 
            href="/contact" 
            className="inline-block bg-white text-blue-800 px-10 py-4 rounded-md hover:bg-gray-100 transition-colors font-semibold text-lg"
          >
            Contact Sales
          </Link>
        </div>
      </div>
    </section>
  )
}