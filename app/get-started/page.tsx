'use client'

import { useState } from 'react'

export default function GetStarted() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    computers: '',
    requestType: 'trial',
    siteCode: '',
    buildNumber: '',
    supportID: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const subject = `${formData.requestType === 'trial' ? 'Free Trial' : formData.requestType === 'demo' ? 'Demo' : 'Quote'} Request from ${formData.name}`
    const body = `Request Type: ${formData.requestType === 'trial' ? 'Free Trial' : formData.requestType === 'demo' ? 'Demo Request' : 'Quote Request'}
Name: ${formData.name}
Email: ${formData.email}
Company: ${formData.company}
Number of Computers: ${formData.computers || 'Not specified'}
Site Code: ${formData.siteCode || 'Not specified'}
Build Number: ${formData.buildNumber || 'Not specified'}
Support ID: ${formData.supportID || 'Not specified'}`
    
    const mailtoLink = `mailto:sales@upgrademate.io?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailtoLink
    
    // Reset form after mailto link is opened
    setTimeout(() => {
      setFormData({ name: '', email: '', company: '', computers: '', requestType: 'trial', siteCode: '', buildNumber: '', supportID: '' })
    }, 1000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">Get Started with UpgradeMate</h1>
        
        <div className="max-w-2xl mx-auto">
          <p className="text-gray-600 text-center mb-8">
            Start your free trial or request a demo to see how UpgradeMate can transform your Windows upgrade process.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Type
                </label>
                <select
                  name="requestType"
                  value={formData.requestType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-upgrade-blue focus:border-transparent"
                >
                  <option value="trial">Free Trial</option>
                  <option value="demo">Request Demo</option>
                  <option value="quote">Get Quote</option>
                </select>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-upgrade-blue focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-upgrade-blue focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company *
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-upgrade-blue focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Computers
                </label>
                <input
                  type="number"
                  name="computers"
                  value={formData.computers}
                  onChange={handleChange}
                  placeholder="Approximate number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-upgrade-blue focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Site Code
                </label>
                <input
                  type="text"
                  name="siteCode"
                  value={formData.siteCode}
                  onChange={handleChange}
                  placeholder="3 digit SCCM Site Code"
                  maxLength={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-upgrade-blue focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Build Number
                </label>
                <input
                  type="text"
                  name="buildNumber"
                  value={formData.buildNumber}
                  onChange={handleChange}
                  placeholder="Windows Build Number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-upgrade-blue focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Support ID
                </label>
                <input
                  type="text"
                  name="supportID"
                  value={formData.supportID}
                  onChange={handleChange}
                  placeholder="SCCM Support ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-upgrade-blue focus:border-transparent"
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-upgrade-blue text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Submit Request
              </button>
            </form>
            
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="font-semibold mb-4">What happens next?</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Our team will review your request within 24 hours</li>
                <li>• We'll contact you to schedule a personalized demo or set up your trial</li>
                <li>• You'll receive full support during your evaluation period</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}