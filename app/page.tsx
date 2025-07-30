import Hero from '@/components/Hero'
import Features from '@/components/Features'
import ForEndUsers from '@/components/ForEndUsers'
import ForITAdmins from '@/components/ForITAdmins'
import PricingCalculator from '@/components/PricingCalculator'
import TransformCTA from '@/components/TransformCTA'

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <ForEndUsers />
      <ForITAdmins />
      <PricingCalculator />
      <TransformCTA />
    </>
  )
}