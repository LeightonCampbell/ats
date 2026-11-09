/** Global brand, contact, and navigation constants for Alert Training Services. */

export const site = {
  businessName: "Alert Training Services",
  legalName: "Alert Training Services, LLC",
  founder: "Judith Morgan",
  founderTitle: "AHA Instructor & Speaker",
  brandSubLabel: "Judith Morgan | Instructor & Speaker",
  phone: "323-921-6244",
  phoneHref: "tel:3239216244",
  email: "info@alerttrainingservices.com",
  emailHref: "mailto:info@alerttrainingservices.com",
  domain: "alerttrainingservices.com",
  siteUrl: "https://www.alerttrainingservices.com",
  accreditation: "American Heart Association (AHA)",
  tagline: "Professional CPR, AED, & Emergency Medical Instruction",
} as const;

export const routes = {
  home: "/",
  courses: "/courses",
  coursesAnchor: "/#courses",
  onsite: "/#onsite",
  bls: "/courses/aha-bls-provider",
  blsRegister: "/courses/aha-bls-provider#register",
  pediatric: "/courses/aha-heartsaver-pediatric",
  pediatricRegister: "/courses/aha-heartsaver-pediatric#register",
  emsa: "/preventative-health-and-safety-training",
  emsaRegister: "/preventative-health-and-safety-training#register",
  speaking: "/speaking",
  speakingInquiry: "/speaking#inquiry",
  about: "/about-us",
  contact: "/contact-us",
  daycareGuide: "/how-to-start-a-home-daycare-in-california",
  blog: "/ats-news",
  classRules: "/class-rules",
} as const;

export const courseCatalog = [
  {
    id: "emsa",
    badge: "EMSA - Approved",
    title: "Preventive Health & Safety Training",
    format: "Evening online sessions · Instant Stripe enrollment",
    body: "EMSA-approved Preventive Health & Safety with Nutrition and Lead Poisoning Prevention for California childcare providers.",
    href: routes.emsa,
    registerHref: routes.emsaRegister,
  },
  {
    id: "bls",
    badge: "American Heart Association (AHA)",
    title: "AHA BLS Provider Course",
    format: "In-person, hands-on instruction · Individual & group sessions",
    body: "High-quality CPR, AED use, team response, and choking relief for adult, child, and infant patients. AHA BLS Provider eCard upon successful completion.",
    href: routes.bls,
    registerHref: routes.blsRegister,
  },
  {
    id: "pediatric",
    badge: "American Heart Association (AHA)",
    title: "AHA Heartsaver Pediatric First Aid CPR AED",
    format: "Hands-on, in-person class · Group & on-site options",
    body: "Pediatric first aid, infant/child CPR, AED skills, and choking response for teachers, babysitters, and caregivers.",
    href: routes.pediatric,
    registerHref: routes.pediatricRegister,
    note: "Not an EMSA-approved childcare licensing course.",
  },
] as const;

export const courseNav = [
  {
    label: "AHA BLS Provider Training",
    href: routes.bls,
  },
  {
    label: "AHA Heartsaver Pediatric First Aid CPR AED",
    href: routes.pediatric,
  },
  {
    label: "On-Site Workplace & Group Training",
    href: routes.onsite,
  },
  {
    label: "EMSA Preventive Health & Safety",
    href: routes.emsa,
  },
] as const;

export const footerQuickLinks = [
  { label: "All Courses", href: routes.courses },
  { label: "BLS Provider Training", href: routes.bls },
  { label: "Pediatric First Aid CPR AED", href: routes.pediatric },
  { label: "On-Site Corporate Sessions", href: routes.onsite },
  { label: "Book Judith Morgan (Speaking)", href: routes.speaking },
  { label: "Contact & Class Inquiry", href: routes.contact },
  { label: "EMSA Preventive Health & Safety", href: routes.emsa },
  { label: "Home Daycare Guide", href: routes.daycareGuide },
] as const;

export function copyrightNotice(year = new Date().getFullYear()) {
  return `© ${year} ${site.legalName}. All rights reserved. American Heart Association logos and course completion cards are registered trademarks of the AHA.`;
}
