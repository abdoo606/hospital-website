import { useCallback, useMemo, useState } from 'react'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import Departments from './components/Departments.jsx'
import Doctors from './components/Doctors.jsx'
import WhyUs from './components/WhyUs.jsx'
import Patients from './components/Patients.jsx'
import Testimonials from './components/Testimonials.jsx'
import Booking from './components/Booking.jsx'
import Faq from './components/Faq.jsx'
import CtaBand from './components/CtaBand.jsx'
import Footer from './components/Footer.jsx'
import Icon from './components/Icon.jsx'
import { useActiveSection, useRevealObserver, useScrolledPast } from './hooks/useScrollFx.js'

const SECTION_IDS = ['departments', 'doctors', 'why', 'patients', 'booking', 'faq']

export default function App() {
  const [preselect, setPreselect] = useState(null)
  const active = useActiveSection(SECTION_IDS)
  const showTop = useScrolledPast(700)

  useRevealObserver()

  const goToBooking = useCallback((payload) => {
    setPreselect(payload)
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const onEnquire = useCallback((payload) => goToBooking(payload), [goToBooking])
  const onBookDoctor = useCallback((doctor) => goToBooking({ doctor: doctor.name, dept: doctor.dept }), [goToBooking])

  const scrollTop = useMemo(
    () => () => window.scrollTo({ top: 0, behavior: 'smooth' }),
    [],
  )

  return (
    <>
      <a className="skip-link" href="#booking">
        Skip to booking
      </a>

      <Header active={active} />

      <main>
        <Hero />
        <Departments onEnquire={onEnquire} />
        <Doctors onBook={onBookDoctor} />
        <WhyUs />
        <Testimonials />
        <Patients />
        <Booking preselect={preselect} />
        <Faq />
        <CtaBand />
      </main>

      <Footer />

      <button
        className={`to-top ${showTop ? 'is-visible' : ''}`}
        onClick={scrollTop}
        aria-label="Back to top"
      >
        <Icon name="chevronUp" size={20} />
      </button>
    </>
  )
}
