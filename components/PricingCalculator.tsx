'use client'

import { useState } from 'react'
import { calculatePrice, formatPrice } from '@/lib/pricing'

export default function PricingCalculator() {
  const [computerCount, setComputerCount] = useState('')
  const [showPrice, setShowPrice] = useState(false)

  const count = parseInt(computerCount) || 0
  const { total, pricePerComputer, isCustom } = calculatePrice(count)

  const handleCalculate = () => {
    if (count > 0) {
      setShowPrice(true)
    }
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">Pricing</h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Transparent pricing that scales with your organization. No hidden fees, no surprises.
        </p>

        <div className="max-w-xl mx-auto bg-gray-50 rounded-lg p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Computers
            </label>
            <input
              type="number"
              value={computerCount}
              onChange={(e) => setComputerCount(e.target.value)}
              placeholder="Enter number of computers"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-upgrade-blue focus:border-transparent"
              min="1"
            />
          </div>

          <button
            onClick={handleCalculate}
            className="w-full bg-upgrade-blue text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Calculate Price
          </button>

          {showPrice && count > 0 && (
            <div className="mt-6 p-6 bg-white rounded-lg border border-gray-200">
              {isCustom ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    For installations above 30,000 computers
                  </p>
                  <p className="text-2xl font-bold text-upgrade-blue">
                    Custom Pricing
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Contact us for a custom offer
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600">Total Annual Price</p>
                    <p className="text-3xl font-bold text-upgrade-blue">
                      {formatPrice(total)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Price Per Computer</p>
                    <p className="text-xl font-semibold text-gray-800">
                      {formatPrice(pricePerComputer)}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="mt-8 space-y-2 text-sm text-gray-600">
            <p>• Up to 2,000 computers: $1,000 (fixed)</p>
            <p>• 2,001 - 10,000: $0.375 per additional computer</p>
            <p>• 10,001 - 30,000: $0.25 per additional computer</p>
            <p>• 30,001+: Custom pricing</p>
          </div>
        </div>
      </div>
    </section>
  )
}