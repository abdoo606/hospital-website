# Staff panel — user guide

For reception, marketing and clinical admin teams. No technical knowledge needed.

Open the staff panel at **`https://your-hospital-domain/admin`** and sign in with the work email and
password you were given. The first time you sign in you will be asked to choose your own password
(at least 10 characters, with an uppercase letter, a lowercase letter and a number).

---

## 1. Patient enquiries

**Enquiries** shows every appointment request submitted through the website — this is the inbox your
reception team works from.

**What arrives automatically:** the patient's name, phone, email, the department and consultant they
asked for, whether they are insured or self-funding, their preferred time, anything they wrote, plus a
reference number (e.g. `MER-482913`) they can quote on the phone.

**The five statuses:**

| Status | Meaning | Who sets it |
| --- | --- | --- |
| **New** | Just arrived, nobody has called yet | Automatic |
| **Contacted** | Someone has spoken to the patient | Reception |
| **Booked** | Appointment is in the diary | Reception |
| **Completed** | Patient has been seen | Clinical admin |
| **Cancelled** | Patient cancelled or did not proceed | Reception |
| **Spam** | Bots and bogus submissions | Reception |

**Working an enquiry:** click any row to open the patient's details. From there you can call, email or
send a WhatsApp message with one click, change the status, flag it **urgent**, and write **internal
notes** — notes are for staff only and are never shown to the patient.

**Finding enquiries:** use the status filter, or search by name, phone, email or reference. Set a date
range to review last month. **Export CSV** downloads whatever is currently filtered — useful for
monthly reporting.

**Deleting patient data:** normally "Delete" just clears the enquiry from the inbox. If a patient asks
you to erase their data (a GDPR/UK GDPR right), an administrator can use *Permanently erase this
patient's data* inside the enquiry. That cannot be undone, and the action itself is recorded in the
activity log.

> **Response promise.** The website tells patients they will be contacted within two working hours.
> Aim to clear the *New* column before lunch and before the end of each day.

---

## 2. Website content

Everything under **Website content** is live on the public site the moment you save — there is no
publishing step and no developer needed.

- **Departments** — the specialty cards on the homepage. Each has a name, tagline, description, up to
  8 bullet highlights, a waiting-time promise (e.g. "Appointments within 48 hours"), an icon, and a
  display order. Use the ↑ ↓ buttons to reorder.
- **Consultants** — your medical team. Each entry shows the name, job title, department, credentials,
  years of experience, rating, review count, languages and next availability on the public site.
- **FAQs** — the questions patients ask before booking. Keep the answers short and honest.
- **Testimonials** — patient quotes shown in the rotating section.
- **Insurers** — the names shown on the insurance card. **Only list insurers you are genuinely
  recognised by** — patients check, and reception has to deal with the fallout.

### Drafts

Every item has a **Published / Draft** switch. A draft is saved in the panel but hidden from the public
website — use it to prepare content (a new department, a new consultant) before making it live.

### Important: clinical claims

Ratings, review counts, waiting-time promises, success rates and "years of experience" are marketing
claims. In the UK (and most countries) healthcare advertising is regulated and anything you publish
must be accurate and evidenceable. Before changing a number, make sure the hospital can prove it.

---

## 3. Media library

**Media library** holds the photography and logos used across the site.

- Drag images onto the page or click **Choose files** to upload (JPG, PNG, WEBP, AVIF or GIF, up to
  6 MB each).
- **Copy URL** gives you the address of an image if you need it for an email template or social post.
- **Hero / About / Facility** sets that image in the corresponding spot on the homepage immediately.
- **Delete** removes the file permanently — if it is still used somewhere on the site, that image will
  break, so replace it first.

Use the hospital's own photography. Real buildings, real clinical teams and real patients (with written
consent) outperform stock imagery every time.

---

## 4. Settings

**Settings** (administrators only) controls the hospital's brand and contact details:

- **Brand** — the name in the logo, the legal entity shown in the footer, and the tagline.
- **Contact & emergency** — the main phone number, the 24/7 emergency line, email, address and opening
  hours. These appear in the header, footer, booking form and every call-to-action button, so update
  them immediately if anything changes.
- **Homepage hero & statistics** — the headline, the supporting paragraph, and the four headline
  figures (30+ specialties, 98% satisfaction, etc.). Only publish figures you can evidence.
- **Photography** — the three main images, chosen from the media library.
- **Search engine listing** — the page title and description that appear in Google.
- **Booking form & data retention** — the note shown next to the submit button and how many months you
  keep patient enquiries.

Press **Save changes** and the public website is updated within seconds.

---

## 5. Staff accounts and the activity log

**Staff accounts** (administrators only) manages who can sign in:

- **Editor** — can manage website content and work patient enquiries. Give this to reception and
  marketing.
- **Administrator** — everything an editor can do, plus settings, staff accounts, the activity log and
  permanent erasure of patient data.

**The activity log** records every sign-in, content change, export and deletion, with the user's name,
the time and the IP address. It cannot be edited from the panel — keep it, because it is the first
thing an auditor or the data protection regulator asks to see.

**House rules**

1. Never share a login. Create a separate account per person and disable it the day they leave.
2. Use your own password — the panel forces this on first sign-in.
3. Do not export patient data to a personal device or mailbox; the CSV export is for hospital systems
   and reporting only.
4. If you think an account has been compromised, disable it immediately and tell IT.

---

## 6. Things that still need a developer

| Task | Why |
| --- | --- |
| Email/SMS notification when an enquiry arrives | So nobody has to watch the inbox all day |
| Diary/calendar integration | To offer real appointment slots instead of preferred times |
| A privacy notice and cookie banner written for your jurisdiction | Themes are in the panel; legal text is a legal decision |
| Connection to your HIS/EMR | If enquiries should land in the hospital's main system |

Everything else — content, photography, enquiries, staff accounts — is self-service.
