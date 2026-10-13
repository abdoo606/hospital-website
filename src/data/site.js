// Central content source. Edit here to re-brand the site for a new hospital client.

export const hospital = {
  name: 'Meridian',
  suffix: 'Private Hospital',
  tagline: 'Private healthcare, without compromise.',
  phone: '+44 20 7946 0912',
  emergency: '+44 20 7946 0999',
  email: 'reception@meridianhospital.com',
  address: '1 Meridian Park, Knightsbridge, London SW1X 7QT',
  hours: 'Outpatient clinics 07:00 – 21:00 · Emergency 24/7',
}

export const stats = [
  { value: 30, suffix: '+', label: 'Medical specialties' },
  { value: 180, suffix: '+', label: 'Consultant specialists' },
  { value: 24, suffix: '/7', label: 'Emergency & critical care' },
  { value: 98, suffix: '%', label: 'Patient satisfaction' },
]

export const departments = [
  {
    id: 'cardiology',
    icon: 'heart',
    name: 'Cardiology',
    tagline: 'Heart & Vascular Institute',
    blurb:
      'Consultant cardiologists, on-site cardiac catheterisation labs and a 24/7 chest pain pathway.',
    highlights: ['Angioplasty & stenting', 'Echocardiography', 'Heart rhythm clinic'],
    wait: 'Appointments within 48 hours',
  },
  {
    id: 'orthopaedics',
    icon: 'bone',
    name: 'Orthopaedics',
    tagline: 'Joints, Spine & Sports Medicine',
    blurb:
      'Robotic-assisted joint replacement and a sports injury team trusted by professional athletes.',
    highlights: ['Robotic knee & hip', 'Spine surgery', 'Sports rehabilitation'],
    wait: 'Appointments within 3 days',
  },
  {
    id: 'neurology',
    icon: 'brain',
    name: 'Neurology',
    tagline: 'Brain & Nervous System',
    blurb:
      'Rapid-access neurology with 3T MRI, EEG and a dedicated migraine and movement disorder service.',
    highlights: ['Stroke prevention', 'Epilepsy clinic', 'Neuro-rehabilitation'],
    wait: 'Appointments within 5 days',
  },
  {
    id: 'oncology',
    icon: 'ribbon',
    name: 'Oncology',
    tagline: 'Comprehensive Cancer Centre',
    blurb:
      'Precision diagnostics, genomic profiling and a multidisciplinary tumour board for every patient.',
    highlights: ['Rapid cancer diagnosis', 'Chemotherapy suites', 'Immunotherapy'],
    wait: 'Two-week urgent pathway',
  },
  {
    id: 'maternity',
    icon: 'mother',
    name: 'Maternity',
    tagline: 'Women & Newborn Care',
    blurb:
      'Private en-suite birthing suites, consultant-led delivery and a level 3 neonatal unit on site.',
    highlights: ['Consultant-led births', 'Fertility & IVF', 'Level 3 NICU'],
    wait: 'Same-week booking',
  },
  {
    id: 'paediatrics',
    icon: 'child',
    name: 'Paediatrics',
    tagline: 'Children & Adolescents',
    blurb:
      'Child-friendly wards, paediatric intensive care and play specialists on every shift.',
    highlights: ['Paediatric surgery', 'Allergy & asthma', 'Child development'],
    wait: 'Appointments within 48 hours',
  },
  {
    id: 'ophthalmology',
    icon: 'eye',
    name: 'Ophthalmology',
    tagline: 'Vision & Eye Surgery',
    blurb:
      'Laser vision correction, cataract surgery and retinal services using next-day diagnostic imaging.',
    highlights: ['Cataract & lens', 'LASIK assessment', 'Macular clinic'],
    wait: 'Appointments within 3 days',
  },
  {
    id: 'diagnostics',
    icon: 'scan',
    name: 'Diagnostics & Imaging',
    tagline: 'MRI · CT · PET-CT',
    blurb:
      'One-stop imaging with same-day reporting from consultant radiologists and pathology lab.',
    highlights: ['3T MRI & PET-CT', 'Full blood profile', 'Health screening'],
    wait: 'Same-day imaging',
  },
  {
    id: 'gastro',
    icon: 'digestive',
    name: 'Gastroenterology',
    tagline: 'Digestive Health',
    blurb:
      'Endoscopy under sedation, IBS and IBD clinics, and a dedicated liver service.',
    highlights: ['Gastroscopy & colonoscopy', 'IBD clinic', 'Liver assessment'],
    wait: 'Appointments within 4 days',
  },
  {
    id: 'ent',
    icon: 'ear',
    name: 'ENT & Audiology',
    tagline: 'Ear, Nose & Throat',
    blurb:
      'Sinus surgery, hearing implants and a balance clinic with on-site audiology testing.',
    highlights: ['Sinus & nasal surgery', 'Hearing implants', 'Vertigo clinic'],
    wait: 'Appointments within 4 days',
  },
  {
    id: 'urology',
    icon: 'kidney',
    name: 'Urology',
    tagline: 'Urinary & Men’s Health',
    blurb:
      'Laser stone treatment, prostate assessment and continence services for men and women.',
    highlights: ['Laser stone removal', 'Prostate clinic', 'Continence care'],
    wait: 'Appointments within 3 days',
  },
  {
    id: 'dermatology',
    icon: 'sparkle',
    name: 'Dermatology',
    tagline: 'Skin, Hair & Laser',
    blurb:
      'Medical and cosmetic dermatology with same-week mole mapping and skin cancer surgery.',
    highlights: ['Mole mapping', 'Acne & eczema', 'Cosmetic laser'],
    wait: 'Appointments within 2 days',
  },
]

export const doctors = [
  {
    id: 'd1',
    name: 'Dr. Amelia Hartley',
    title: 'Consultant Interventional Cardiologist',
    dept: 'Cardiology',
    credentials: 'MD, FRCP',
    years: 19,
    rating: 4.9,
    reviews: 412,
    languages: 'English, French',
    availability: 'Next available: Tue 09:40',
  },
  {
    id: 'd2',
    name: 'Mr. Daniel Okonjo',
    title: 'Consultant Orthopaedic Surgeon',
    dept: 'Orthopaedics',
    credentials: 'MBBS, FRCS (Orth)',
    years: 16,
    rating: 4.9,
    reviews: 358,
    languages: 'English, German',
    availability: 'Next available: Mon 14:20',
  },
  {
    id: 'd3',
    name: 'Dr. Sofia Marchetti',
    title: 'Consultant Neurologist',
    dept: 'Neurology',
    credentials: 'MD, PhD',
    years: 14,
    rating: 4.8,
    reviews: 291,
    languages: 'English, Italian',
    availability: 'Next available: Wed 11:00',
  },
  {
    id: 'd4',
    name: 'Dr. Priya Raghunathan',
    title: 'Consultant Medical Oncologist',
    dept: 'Oncology',
    credentials: 'MD, MRCP',
    years: 17,
    rating: 5.0,
    reviews: 233,
    languages: 'English, Tamil, Hindi',
    availability: 'Next available: Thu 08:30',
  },
  {
    id: 'd5',
    name: 'Dr. Hannah Weiss',
    title: 'Consultant Obstetrician & Gynaecologist',
    dept: 'Maternity',
    credentials: 'MD, MRCOG',
    years: 15,
    rating: 4.9,
    reviews: 507,
    languages: 'English, German',
    availability: 'Next available: Tue 16:10',
  },
  {
    id: 'd6',
    name: 'Dr. Omar Al-Farsi',
    title: 'Consultant Paediatrician',
    dept: 'Paediatrics',
    credentials: 'MD, FRCPCH',
    years: 13,
    rating: 4.8,
    reviews: 264,
    languages: 'English, Arabic',
    availability: 'Next available: Mon 10:15',
  },
  {
    id: 'd7',
    name: 'Mr. James Fenwick',
    title: 'Consultant Ophthalmic Surgeon',
    dept: 'Ophthalmology',
    credentials: 'MBBS, FRCOphth',
    years: 21,
    rating: 4.9,
    reviews: 389,
    languages: 'English',
    availability: 'Next available: Fri 09:00',
  },
  {
    id: 'd8',
    name: 'Dr. Elena Novak',
    title: 'Consultant Radiologist, Head of Imaging',
    dept: 'Diagnostics & Imaging',
    credentials: 'MD, FRCR',
    years: 18,
    rating: 4.9,
    reviews: 176,
    languages: 'English, Czech',
    availability: 'Next available: Same-day reporting',
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

export const faqs = [
  {
    q: 'How quickly can I be seen by a consultant?',
    a: 'Most outpatient appointments are offered within 48 hours, and urgent referrals are triaged the same working day. Our emergency department is open 24/7 with no appointment needed.',
  },
  {
    q: 'Do you work with private medical insurance?',
    a: 'Yes. We are recognised by all major UK and international insurers, and our team will handle pre-authorisation on your behalf. We also welcome self-funding patients with transparent fixed-price packages.',
  },
  {
    q: 'What is included in a fixed-price package?',
    a: 'Every package covers the surgeon and anaesthetist fees, theatre time, your inpatient stay, standard implants, follow-up consultations and any related physiotherapy for the stated recovery period. You receive a written quotation before admission — no surprises.',
  },
  {
    q: 'Do you treat international patients?',
    a: 'We run a dedicated International Patient Office that arranges visa letters, medical-record translation, airport transfers and interpreter services in more than 20 languages, plus accommodation for companions.',
  },
  {
    q: 'Can I choose which consultant treats me?',
    a: 'Absolutely. You can request a specific consultant when booking, review their experience and patient ratings on this site, and switch consultants at any point without losing your place in the pathway.',
  },
  {
    q: 'How do I get my medical records and imaging?',
    a: 'Digital reports, imaging and discharge summaries are released to your secure patient portal within 48 hours, and we can share them directly with your GP or another hospital on request.',
  },
]

export const specialtiesList = ['All specialties', ...departments.map((d) => d.name)]
