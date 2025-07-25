export function calculatePrice(computerCount: number): { 
  total: number; 
  pricePerComputer: number;
  isCustom: boolean;
} {
  if (computerCount <= 0) {
    return { total: 0, pricePerComputer: 0, isCustom: false }
  }

  if (computerCount <= 2000) {
    return { 
      total: 1000, 
      pricePerComputer: 1000 / computerCount,
      isCustom: false
    }
  }

  if (computerCount <= 10000) {
    const additionalComputers = computerCount - 2000
    const total = 1000 + (additionalComputers * 0.375)
    return { 
      total, 
      pricePerComputer: total / computerCount,
      isCustom: false
    }
  }

  if (computerCount <= 30000) {
    const additionalComputers = computerCount - 10000
    const total = 4000 + (additionalComputers * 0.25)
    return { 
      total, 
      pricePerComputer: total / computerCount,
      isCustom: false
    }
  }

  return { 
    total: 0, 
    pricePerComputer: 0,
    isCustom: true
  }
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}