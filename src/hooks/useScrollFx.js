import { useEffect, useRef, useState } from 'react'

/** True once the page has scrolled past `threshold` px. */
export function useScrolledPast(threshold = 12) {
  const [passed, setPassed] = useState(false)

  useEffect(() => {
    const onScroll = () => setPassed(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return passed
}

/** Reveals every `.reveal` element once it scrolls into view (incl. newly added nodes). */
export function useRevealObserver() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      document.documentElement.classList.add('no-io')
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -50px 0px' },
    )

    const scan = (root) => {
      if (!root.querySelectorAll) return
      root.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => io.observe(el))
    }

    scan(document)

    // Filtered/searched lists mount new cards after the initial pass.
    const mo = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return
          if (node.matches && node.matches('.reveal:not(.is-visible)')) io.observe(node)
          scan(node)
        })
      })
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      mo.disconnect()
      io.disconnect()
    }
  }, [])
}

/** Scroll-spy: returns the id of the section currently in view. */
export function useActiveSection(ids) {
  const [active, setActive] = useState('')

  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const offset = window.scrollY + 140
        let current = ''
        ids.forEach((id) => {
          const el = document.getElementById(id)
          if (el && el.offsetTop <= offset) current = id
        })
        const nearBottom =
          window.innerHeight + window.scrollY >= document.body.offsetHeight - 80
        setActive(nearBottom ? ids[ids.length - 1] : current)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ids])

  return active
}

/** Counts from 0 → `value` the first time the element is visible. */
export function useCountUp(value, duration = 1500) {
  const ref = useRef(null)
  const [display, setDisplay] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (!('IntersectionObserver' in window)) {
      setDisplay(value)
      return
    }
    const run = () => {
      if (started.current) return
      started.current = true
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reduce) {
        setDisplay(value)
        return
      }
      const start = performance.now()
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1)
        const eased = 1 - Math.pow(1 - p, 3)
        setDisplay(Math.round(value * eased))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && run()),
      { threshold: 0.4 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [value, duration])

  return [ref, display]
}
