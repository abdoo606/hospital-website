/**
 * Seed content — the starting data for a fresh database.
 * Everything here is editable in the admin panel afterwards.
 * Re-branding for a new hospital = edit these values (or the admin Settings screen).
 */

export const settings = {
  brand_name: 'Meridian',
  brand_suffix: 'Private Hospital',
  legal_name: 'Meridian Private Hospital Ltd',
  tagline: 'Private healthcare, without compromise.',

  phone: '+44 20 7946 0912',
  emergency_phone: '+44 20 7946 0999',
  email: 'reception@meridianhospital.com',
  address: '1 Meridian Park, Knightsbridge, London SW1X 7QT',
  hours: 'Outpatient clinics 07:00 – 21:00 · Emergency 24/7',
  accreditations: 'JCI accredited · CQC registered private hospital',
  emergency_banner: '24/7 Emergency',

  seo_title: 'Meridian Private Hospital — World-Class Private Healthcare',
  seo_description:
    'Meridian Private Hospital delivers consultant-led private healthcare: 30+ specialties, JCI-accredited facilities, same-week appointments and 24/7 emergency care.',

  hero_heading: 'Private healthcare,',
  hero_highlight: 'without compromise.',
  hero_sub:
    "Consultant-led medicine in one of Europe's most advanced private hospitals. Rapid access, transparent fixed pricing, and a team that treats you as a person — not a case number.",
  hero_image: '',
  about_image: '',
  facility_image: '',

  stat1_value: '30', stat1_suffix: '+', stat1_label: 'Medical specialties',
  stat2_value: '180', stat2_suffix: '+', stat2_label: 'Consultant specialists',
  stat3_value: '24', stat3_suffix: '/7', stat3_label: 'Emergency & critical care',
  stat4_value: '98', stat4_suffix: '%', stat4_label: 'Patient satisfaction',

  booking_note:
    'Typical response time: under 2 working hours. A named coordinator replies with consultant options, availability and costs.',
  retention_months: '24',
}

export const departments = [
  {
    name: 'Cardiology',
    tagline: 'Heart & Vascular Institute',
    blurb:
      'Consultant cardiologists, on-site cardiac catheterisation labs and a 24/7 chest pain pathway.',
    icon: 'heart',
    highlights: ['Angioplasty & stenting', 'Echocardiography', 'Heart rhythm clinic'],
    wait_label: 'Appointments within 48 hours',
  },
  {
    name: 'Orthopaedics',
    tagline: 'Joints, Spine & Sports Medicine',
    blurb:
      'Robotic-assisted joint replacement and a sports injury team trusted by professional athletes.',
    icon: 'bone',
    highlights: ['Robotic knee & hip', 'Spine surgery', 'Sports rehabilitation'],
    wait_label: 'Appointments within 3 days',
  },
  {
    name: 'Neurology',
    tagline: 'Brain & Nervous System',
    blurb:
      'Rapid-access neurology with 3T MRI, EEG and a dedicated migraine and movement disorder service.',
    icon: 'brain',
    highlights: ['Stroke prevention', 'Epilepsy clinic', 'Neuro-rehabilitation'],
    wait_label: 'Appointments within 5 days',
  },
  {
    name: 'Oncology',
    tagline: 'Comprehensive Cancer Centre',
    blurb:
      'Precision diagnostics, genomic profiling and a multidisciplinary tumour board for every patient.',
    icon: 'ribbon',
    highlights: ['Rapid cancer diagnosis', 'Chemotherapy suites', 'Immunotherapy'],
    wait_label: 'Two-week urgent pathway',
  },
  {
    name: 'Maternity',
    tagline: 'Women & Newborn Care',
    blurb:
      'Private en-suite birthing suites, consultant-led delivery and a level 3 neonatal unit on site.',
    icon: 'mother',
    highlights: ['Consultant-led births', 'Fertility & IVF', 'Level 3 NICU'],
    wait_label: 'Same-week booking',
  },
  {
    name: 'Paediatrics',
    tagline: 'Children & Adolescents',
    blurb: 'Child-friendly wards, paediatric intensive care and play specialists on every shift.',
    icon: 'child',
    highlights: ['Paediatric surgery', 'Allergy & asthma', 'Child development'],
    wait_label: 'Appointments within 48 hours',
  },
  {
    name: 'Ophthalmology',
    tagline: 'Vision & Eye Surgery',
    blurb:
      'Laser vision correction, cataract surgery and retinal services using next-day diagnostic imaging.',
    icon: 'eye',
    highlights: ['Cataract & lens', 'LASIK assessment', 'Macular clinic'],
    wait_label: 'Appointments within 3 days',
  },
  {
    name: 'Diagnostics & Imaging',
    tagline: 'MRI · CT · PET-CT',
    blurb:
      'One-stop imaging with same-day reporting from consultant radiologists and a full pathology lab.',
    icon: 'scan',
    highlights: ['3T MRI & PET-CT', 'Full blood profile', 'Health screening'],
    wait_label: 'Same-day imaging',
  },
  {
    name: 'Gastroenterology',
    tagline: 'Digestive Health',
    blurb: 'Endoscopy under sedation, IBS and IBD clinics, and a dedicated liver service.',
    icon: 'digestive',
    highlights: ['Gastroscopy & colonoscopy', 'IBD clinic', 'Liver assessment'],
    wait_label: 'Appointments within 4 days',
  },
  {
    name: 'ENT & Audiology',
    tagline: 'Ear, Nose & Throat',
    blurb:
      'Sinus surgery, hearing implants and a balance clinic with on-site audiology testing.',
    icon: 'ear',
    highlights: ['Sinus & nasal surgery', 'Hearing implants', 'Vertigo clinic'],
    wait_label: 'Appointments within 4 days',
  },
  {
    name: 'Urology',
    tagline: 'Urinary & Men’s Health',
    blurb:
      'Laser stone treatment, prostate assessment and continence services for men and women.',
    icon: 'kidney',
    highlights: ['Laser stone removal', 'Prostate clinic', 'Continence care'],
    wait_label: 'Appointments within 3 days',
  },
  {
    name: 'Dermatology',
    tagline: 'Skin, Hair & Laser',
    blurb:
      'Medical and cosmetic dermatology with same-week mole mapping and skin cancer surgery.',
    icon: 'sparkle',
    highlights: ['Mole mapping', 'Acne & eczema', 'Cosmetic laser'],
    wait_label: 'Appointments within 2 days',
  },
]

export const consultants = [
  {
    name: 'Dr. Amelia Hartley',
    title: 'Consultant Interventional Cardiologist',
    department: 'Cardiology',
    credentials: 'MD, FRCP',
    years: 19,
    rating: 4.9,
    reviews: 412,
    languages: 'English, French',
    availability: 'Next available: Tue 09:40',
  },
  {
    name: 'Mr. Daniel Okonjo',
    title: 'Consultant Orthopaedic Surgeon',
    department: 'Orthopaedics',
    credentials: 'MBBS, FRCS (Orth)',
    years: 16,
    rating: 4.9,
    reviews: 358,
    languages: 'English, German',
    availability: 'Next available: Mon 14:20',
  },
  {
    name: 'Dr. Sofia Marchetti',
    title: 'Consultant Neurologist',
    department: 'Neurology',
    credentials: 'MD, PhD',
    years: 14,
    rating: 4.8,
    reviews: 291,
    languages: 'English, Italian',
    availability: 'Next available: Wed 11:00',
  },
  {
    name: 'Dr. Priya Raghunathan',
    title: 'Consultant Medical Oncologist',
    department: 'Oncology',
    credentials: 'MD, MRCP',
    years: 17,
    rating: 5.0,
    reviews: 233,
    languages: 'English, Tamil, Hindi',
    availability: 'Next available: Thu 08:30',
  },
  {
    name: 'Dr. Hannah Weiss',
    title: 'Consultant Obstetrician & Gynaecologist',
    department: 'Maternity',
    credentials: 'MD, MRCOG',
    years: 15,
    rating: 4.9,
    reviews: 507,
    languages: 'English, German',
    availability: 'Next available: Tue 16:10',
  },
  {
    name: 'Dr. Omar Al-Farsi',
    title: 'Consultant Paediatrician',
    department: 'Paediatrics',
    credentials: 'MD, FRCPCH',
    years: 13,
    rating: 4.8,
    reviews: 264,
    languages: 'English, Arabic',
    availability: 'Next available: Mon 10:15',
  },
  {
    name: 'Mr. James Fenwick',
    title: 'Consultant Ophthalmic Surgeon',
    department: 'Ophthalmology',
    credentials: 'MBBS, FRCOphth',
    years: 21,
    rating: 4.9,
    reviews: 389,
    languages: 'English',
    availability: 'Next available: Fri 09:00',
  },
  {
    name: 'Dr. Elena Novak',
    title: 'Consultant Radiologist, Head of Imaging',
    department: 'Diagnostics & Imaging',
    credentials: 'MD, FRCR',
    years: 18,
    rating: 4.9,
    reviews: 176,
    languages: 'English, Czech',
    availability: 'Next available: Same-day reporting',
  },
]

export const faqs = [
  {
    question: 'How quickly can I be seen by a consultant?',
    answer:
      'Most outpatient appointments are offered within 48 hours, and urgent referrals are triaged the same working day. Our emergency department is open 24/7 with no appointment needed.',
  },
  {
    question: 'Do you work with private medical insurance?',
    answer:
      'Yes. We are recognised by all major UK and international insurers, and our team will handle pre-authorisation on your behalf. We also welcome self-funding patients with transparent fixed-price packages.',
  },
  {
    question: 'What is included in a fixed-price package?',
    answer:
      'Every package covers the surgeon and anaesthetist fees, theatre time, your inpatient stay, standard implants, follow-up consultations and any related physiotherapy for the stated recovery period. You receive a written quotation before admission — no surprises.',
  },
  {
    question: 'Do you treat international patients?',
    answer:
      'We run a dedicated International Patient Office that arranges visa letters, medical-record translation, airport transfers and interpreter services in more than 20 languages, plus accommodation for companions.',
  },
  {
    question: 'Can I choose which consultant treats me?',
    answer:
      'Absolutely. You can request a specific consultant when booking, review their experience and patient ratings on this site, and switch consultants at any point without losing your place in the pathway.',
  },
  {
    question: 'How do I get my medical records and imaging?',
    answer:
      'Digital reports, imaging and discharge summaries are released to your secure patient portal within 48 hours, and we can share them directly with your GP or another hospital on request.',
  },
]

export const testimonials = [
  {
    quote:
      'I was seen by a consultant cardiologist within 24 hours of my first call. The level of attention — and the calm of the whole building — made a frightening week manageable.',
    name: 'Richard M.',
    detail: 'Cardiology patient',
    location: 'London',
  },
  {
    quote:
      'Our daughter was admitted overnight and the paediatric team explained every single step to us. We never once felt like a number.',
    name: 'Aisha & Karim B.',
    detail: 'Paediatric inpatients',
    location: 'Dubai',
  },
  {
    quote:
      'Knee replacement on Monday, walking with a frame on Tuesday, home on Thursday. The physio programme afterwards was outstanding.',
    name: 'Margaret D.',
    detail: 'Orthopaedic surgery',
    location: 'Surrey',
  },
  {
    quote:
      'As an overseas patient I needed speed. Imaging, a tumour board decision and a treatment plan inside one week. Genuinely world-class coordination.',
    name: 'Yusuf A.',
    detail: 'Oncology, international patient',
    location: 'Doha',
  },
]

export const insurers = [
  'BUPA',
  'AXA Health',
  'Cigna',
  'Allianz Care',
  'Aetna International',
  'Vitality',
  'Healix',
  'WPA',
]
