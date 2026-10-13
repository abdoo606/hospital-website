import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { testimonials } from '../data/site.js'

export default function Testimonials() {
  const [index, setIndex] = useState(0)
  const [fading, setFading] = useState(false)
  const timer = useRef(null)

  const go = (next) => {
    setFading(true)
    window.setTimeout(() => {
      setIndex(((next % testimonials.length) + testimonials.length) % testimonials.length)
      setFading(false)
    }, 260)
  }

  useEffect(() => {
    timer.current = window.setInterval(() => {
      setFading(true)
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % testimonials.length)
        setFading(false)
      }, 260)
    }, 7000)
    return () => window.clearInterval(timer.current)
  }, [])

  const t = testimonials[index]

  return (
    <section className="section section--ink">
      <div className="container">
        <div className="section-head section-head--center">
          <span className="eyebrow">Patient voices</span>
          <h2 style={{ color: '#fff' }}>Rated 4.9 out of 5 by our patients</h2>
        </div>

        <div className="slider">
          <span className="quote-stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <Icon key={i} name="star" size={19} fill="currentColor" strokeWidth={0} />
            ))}
          </span>

          <div className={`slider__card ${fading ? 'is-fading' : ''}`}>
            <blockquote>“{t.quote}”</blockquote>
            <cite>
              {t.name}
              <span>
                {t.detail} · {t.location}
              </span>
            </cite>
          </div>

          <div className="slider__dots" role="tablist" aria-label="Patient testimonials">
            {testimonials.map((item, i) => (
              <button
                key={item.name}
                role="tab"
                aria-current={i === index}
                aria-label={`Testimonial ${i + 1}`}
                onClick={() => go(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
