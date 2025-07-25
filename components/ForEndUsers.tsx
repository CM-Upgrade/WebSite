export default function ForEndUsers() {
  const features = [
    {
      icon: "⚡",
      title: "Lightning-Fast Updates",
      description: "We pre-download upgrade packages in the background. When you're ready to upgrade, it's already there. No more waiting around."
    },
    {
      icon: "🎯",
      title: "Smart Compatibility Checks",
      description: "We scan first, upgrade second. Only compatible machines get the green light, meaning fewer failures and less frustration."
    },
    {
      icon: "⏰",
      title: "You Choose When",
      description: "Pick your upgrade time within IT's schedule. Work on your terms, upgrade when it suits you best."
    },
    {
      icon: "🛡️",
      title: "Zero Data Loss",
      description: "Clear on-screen guidance throughout the process. We lock the screen during critical moments to prevent any accidents."
    },
    {
      icon: "🎨",
      title: "Familiar Experience",
      description: "See your company branding, messages in your language. It feels like your IT team is right there with you."
    }
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
            For End Users: Upgrades That Respect Your Time
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}