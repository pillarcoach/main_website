import Nav              from '@/components/Nav'
import Hero             from '@/components/Hero'
import ProductSlideshow from '@/components/ProductSlideshow'
import Why              from '@/components/Why'
import HowItWorks       from '@/components/HowItWorks'
import Signup           from '@/components/Signup'
import CareersTeaser    from '@/components/CareersTeaser'
import Footer           from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ProductSlideshow />
        <Why />
        <HowItWorks />
        <Signup />
        <CareersTeaser />
      </main>
      <Footer />
    </>
  )
}
