import Nav           from '@/components/Nav'
import Hero          from '@/components/Hero'
import Why           from '@/components/Why'
import Features      from '@/components/Features'
import Product       from '@/components/Product'
import HowItWorks    from '@/components/HowItWorks'
import Signup        from '@/components/Signup'
import CareersTeaser from '@/components/CareersTeaser'
import Footer        from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Why />
        <Features />
        <Product />
        <HowItWorks />
        <Signup />
        <CareersTeaser />
      </main>
      <Footer />
    </>
  )
}
