export default function About() {
  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">About UpgradeMate</h1>
        
        <div className="max-w-3xl mx-auto space-y-6 text-gray-600">
          <p className="text-lg">
            UpgradeMate is the smart add-on for ConfigMgr (SCCM) that transforms enterprise 
            Windows OS upgrades from a nightmare into a smooth, predictable process.
          </p>
          
          <p>
            We understand that enterprise environments are complex - with custom configurations, 
            specialized software, and strict security policies. That's exactly why we built 
            UpgradeMate. Our solution works seamlessly with your existing ConfigMgr investment,
            providing a comprehensive upgrade management platform that actually works in the real world.
          </p>
          
          <h2 className="text-2xl font-semibold text-gray-900 mt-8">Key Benefits</h2>
          
          <ul className="list-disc pl-6 space-y-2">
            <li>Setup in minutes with our wizard - what used to take hours</li>
            <li>Pre-download packages for lightning-fast upgrades</li>
            <li>Smart compatibility checks prevent failures before they happen</li>
            <li>PowerBI dashboard for real-time tracking and insights</li>
            <li>Works offline - perfect for remote workers</li>
            <li>Users choose their upgrade time within IT's schedule</li>
            <li>Zero data loss with clear guidance and screen locking</li>
          </ul>
          
          <h2 className="text-2xl font-semibold text-gray-900 mt-8">Who Uses UpgradeMate?</h2>
          
          <p>
            UpgradeMate is trusted by IT departments in organizations of all sizes, from small 
            businesses with hundreds of computers to large enterprises managing tens of thousands 
            of devices. Our flexible pricing model ensures that organizations of any size can 
            benefit from streamlined Windows upgrades.
          </p>
        </div>
      </div>
    </div>
  )
}