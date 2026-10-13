import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import { fallbackSite, specialtiesFrom } from '../data/site.js'

const SiteContext = createContext({
  data: fallbackSite,
  status: 'loading',
  refresh: () => {},
  specialties: specialtiesFrom(fallbackSite.consultants),
})

/**
 * Loads the hospital's content from `GET /api/site` (edited in the admin panel).
 * Falls back to the bundled content if the API is unreachable, so the public
 * website never goes blank.
 */
export function SiteProvider({ children }) {
  const [data, setData] = useState(fallbackSite)
  const [status, setStatus] = useState('loading')

  const load = useCallback(async (signal) => {
    try {
      const payload = await api.get('/api/site', { signal })
      if (payload?.settings?.brand_name) {
        setData({
          settings: { ...fallbackSite.settings, ...payload.settings },
          stats: payload.stats?.length ? payload.stats : fallbackSite.stats,
          departments: payload.departments?.length ? payload.departments : fallbackSite.departments,
          consultants: payload.consultants || [],
          faqs: payload.faqs?.length ? payload.faqs : fallbackSite.faqs,
          testimonials: payload.testimonials?.length ? payload.testimonials : fallbackSite.testimonials,
          insurers: payload.insurers?.length ? payload.insurers : fallbackSite.insurers,
        })
        setStatus('live')
      } else {
        setStatus('fallback')
      }
    } catch {
      setStatus('fallback')
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  // Keep the browser tab and meta description in sync with the CMS.
  useEffect(() => {
    const { seo_title: title, seo_description: description } = data.settings
    if (title) document.title = title
    const meta = document.querySelector('meta[name="description"]')
    if (meta && description) meta.setAttribute('content', description)
  }, [data.settings])

  const value = useMemo(
    () => ({
      data,
      status,
      refresh: () => load(),
      specialties: specialtiesFrom(data.consultants),
      settings: data.settings,
    }),
    [data, status, load],
  )

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export const useSite = () => useContext(SiteContext)
