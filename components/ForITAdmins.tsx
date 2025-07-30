import Image from 'next/image'
import { getImagePath } from '@/lib/config'

export default function ForITAdmins() {
  const benefits = [
    {
      icon: "🎛️",
      title: "Native SCCM Integration",
      description: "Uses Collections, Task Sequences, and Deployments. You're always in control."
    },
    {
      icon: "🌐",
      title: "Works Offline Too",
      description: "Two-stage process perfect for remote workers and home offices."
    },
    {
      icon: "📈",
      title: "Business Intelligence",
      description: "Real-time PowerBI dashboards show exactly what's happening."
    },
    {
      icon: "⚙️",
      title: "Automated Setup",
      description: "Complete environment configuration for your specific needs."
    }
  ]

  return (
    <section className="py-20 bg-white" id="for-admins">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-start max-w-7xl mx-auto">
          <div className="bg-gray-50 p-10 rounded-xl shadow-lg">
            <div className="bg-gray-700 text-white px-5 py-4 rounded-t-lg font-semibold">
              PowerBI Analytics Dashboard
            </div>
            <div className="bg-white p-4 rounded-b-lg">
              <Image 
                src={getImagePath('/dashboard.png')}
                alt="PowerBI Analytics Dashboard" 
                width={600} 
                height={400}
                className="w-full h-auto rounded"
              />
            </div>
          </div>
          
          <div>
            <h2 className="text-4xl font-bold text-gray-800 mb-8">
              For IT Admins: Control Meets Simplicity
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
        </div>
      </div>
    </section>
  )
}