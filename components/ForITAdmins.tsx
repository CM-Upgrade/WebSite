export default function ForITAdmins() {
  const features = [
    {
      icon: "🚀",
      title: "Setup in Minutes",
      description: "Our wizard handles everything - inventory, OS upgrade packages, collections. What used to take hours now takes minutes."
    },
    {
      icon: "📊",
      title: "PowerBI Dashboard That Actually Helps",
      description: "Track every upgrade in real-time. Spot blockers instantly. Cut your test and pilot phases in half."
    },
    {
      icon: "🌐",
      title: "Works Offline Too",
      description: "Two-stage process: download first, upgrade later. Perfect for remote workers and home offices."
    },
    {
      icon: "🎛️",
      title: "You're Always in Control",
      description: "Using native SCCM components - Collections, Task Sequences, Deployments. Speed up, slow down, pause, resume - it's all in your hands."
    }
  ]

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
            For IT Admins: Control Meets Simplicity
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                <div className="flex items-start">
                  <div className="text-4xl mr-4 flex-shrink-0">{feature.icon}</div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}