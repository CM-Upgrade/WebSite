export default function WhatWeDo() {
  const weHandle = [
    "Complete SCCM environment setup for your specific Windows versions",
    "Automatic detection of upgrade blockers",
    "Real-time tracking with PowerBI business intelligence",
    "Custom configuration for your unique environment"
  ]

  const youHandle = [
    "OS-specific issues (contact Microsoft)",
    "Application compatibility (contact your software vendors)",
    "Your existing SCCM infrastructure"
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
            What We Do (And Don't Do)
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-2xl font-semibold mb-6 text-gray-900 flex items-center">
                <span className="text-green-500 mr-3">✅</span> We Handle
              </h3>
              <ul className="space-y-3">
                {weHandle.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white rounded-lg p-8 shadow-sm">
              <h3 className="text-2xl font-semibold mb-6 text-gray-900 flex items-center">
                <span className="text-blue-500 mr-3">📞</span> You Handle
              </h3>
              <ul className="space-y-3">
                {youHandle.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-1">•</span>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}