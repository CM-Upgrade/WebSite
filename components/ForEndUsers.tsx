import Image from 'next/image'
import { getImagePath } from '@/lib/config'

export default function ForEndUsers() {
  const benefits = [
    {
      icon: "⚡",
      title: "Lightning-Fast Updates",
      description: "Pre-downloaded packages mean no waiting around when you're ready to upgrade."
    },
    {
      icon: "⏰",
      title: "You Choose When",
      description: "Pick your upgrade time within IT's schedule. Work on your terms."
    },
    {
      icon: "🛡️",
      title: "Zero Data Loss",
      description: "Clear guidance and screen locks during critical moments prevent accidents."
    },
    {
      icon: "🎨",
      title: "Familiar Experience",
      description: "See your company branding and messages in your language."
    }
  ]

  return (
    <section className="py-20 bg-white" id="for-users">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-start max-w-7xl mx-auto">
          <div>
            <h2 className="text-4xl font-bold text-gray-800 mb-8">
              For End Users: Upgrades That Respect Your Time
            </h2>
            <ul className="space-y-0">
              {benefits.map((benefit, index) => (
                <li 
                  key={index} 
                  className="py-4 border-b border-gray-200 last:border-b-0 flex items-start gap-4"
                >
                  <span className="text-2xl text-blue-800 flex-shrink-0">{benefit.icon}</span>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">{benefit.title}</h4>
                    <p className="text-gray-600 text-sm">{benefit.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-gray-50 p-10 rounded-xl shadow-lg">
            <div className="bg-gray-700 text-white px-5 py-4 rounded-t-lg font-semibold">
              UpgradeMate User Interface
            </div>
            <div className="bg-white p-4 rounded-b-lg">
              <Image 
                src={getImagePath('/formv2.png')}
                alt="UpgradeMate User Interface Form" 
                width={600} 
                height={400}
                className="w-full h-auto rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}