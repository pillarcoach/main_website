import Nav              from '@/components/Nav'
import Hero             from '@/components/Hero'
import ProductSlideshow from '@/components/ProductSlideshow'
import Why              from '@/components/Why'
import Features         from '@/components/Features'
import HowItWorks       from '@/components/HowItWorks'
import Signup           from '@/components/Signup'
import CareersTeaser    from '@/components/CareersTeaser'
import Footer           from '@/components/Footer'
import FontToggle       from '@/components/FontToggle'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ProductSlideshow />
        <Why />
        <Features />
        <HowItWorks />
        <Signup />
        <CareersTeaser />
      </main>
      <Footer />
      <FontToggle />
    </>
  )
}
