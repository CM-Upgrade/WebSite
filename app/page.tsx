import Hero from '@/components/Hero'
import WhatIsUpgradeMate from '@/components/WhatIsUpgradeMate'
import ForEndUsers from '@/components/ForEndUsers'
import ForITAdmins from '@/components/ForITAdmins'
import WhatWeDo from '@/components/WhatWeDo'
import TransformCTA from '@/components/TransformCTA'
import PricingCalculator from '@/components/PricingCalculator'
import Features from '@/components/Features'

export default function Home() {
  return (
    <>
      <Hero />
      <WhatIsUpgradeMate />
      <ForEndUsers />
      <ForITAdmins />
      <WhatWeDo />
      <TransformCTA />
      <PricingCalculator />
      <Features />
    </>
  )
}