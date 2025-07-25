export default function Features() {
  const features = [
    {
      title: "Built for Enterprise",
      description: "Designed specifically for complex corporate environments"
    },
    {
      title: "SCCM Native", 
      description: "Works with your existing ConfigMgr investment"
    },
    {
      title: "Proven Results",
      description: "Higher success rates, shorter deployment times"
    },
    {
      title: "Happy Users",
      description: "Finally, upgrades that don't disrupt productivity"
    }
  ]

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why UpgradeMate?</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start p-6 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-upgrade-blue rounded-full mt-2 mr-4 flex-shrink-0"></div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}