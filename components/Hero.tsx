import Link from 'next/link'

export default function Hero() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold font-montserrat text-upgrade-medium-blue mb-6 animate-fade-in-up">
            Make Windows Upgrades Actually Work
          </h1>
          <p className="text-xl md:text-2xl font-open-sans text-upgrade-dark-gray mb-12 animate-fade-in-up animation-delay-200">
            The smart add-on for ConfigMgr (SCCM) that turns enterprise Windows OS upgrades from a nightmare into a smooth ride.
          </p>
        </div>
      </div>
    </section>
  )
}