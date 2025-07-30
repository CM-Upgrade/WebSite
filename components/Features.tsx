export default function Features() {
  const features = [
    {
      icon: "🚀",
      title: "Setup in Minutes",
      description: "Our wizard handles everything - inventory, OS upgrade packages, collections. What used to take hours now takes minutes."
    },
    {
      icon: "📊",
      title: "Real-Time Analytics", 
      description: "PowerBI dashboard that actually helps. Track every upgrade, spot blockers instantly, cut test phases in half."
    },
    {
      icon: "🎯",
      title: "Higher Success Rates",
      description: "Smart compatibility checks mean only ready machines get upgraded. Fewer failures, happier users."
    }
  ]

  return (
    <section className="py-20 bg-white" id="features">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center font-montserrat text-upgrade-black mb-12">Why UpgradeMate?</h2>
        
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto mb-20">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-gray-50 p-10 rounded-xl hover:transform hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-2xl font-semibold mb-4 font-montserrat text-upgrade-black">{feature.title}</h3>
              <p className="text-upgrade-dark-gray leading-relaxed font-open-sans">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}