export const weddingConfig = {
  couple: {
    firstNames: "Karsen & Sarah",
    displayName: "Karsen & Sarah",
    initials: "K & S"
  },
  date: {
    label: "July 17, 2027",
    shortLabel: "07 - 17 - 27",
    localDateTime: "2027-07-17 12:00 PM",
    iso: "2027-07-17T12:00:00-04:00",
    timezone: "America/Toronto"
  },
  venue: {
    reception: "The Boathouse Restaurant & Event Venue",
    receptionLocation: "Bronte Harbour · Oakville, Ontario",
    receptionAddress: null,
    tentativeCeremony: {
      venue: "St. Mary's Catholic Church",
      status: "tentative",
      public: false
    }
  },
  contact: {
    email: "wedding@thewimmers.ca"
  },
  links: {
    websiteUrl: "https://thewimmers.ca",
    canonicalDomain: "thewimmers.ca",
    googlePhotosUrl: null,
    kahootUrl: null
  },
  social: {
    title: "Karsen & Sarah - July 17, 2027",
    description:
      "Save the date for Karsen and Sarah's wedding celebration at Bronte Harbour.",
    image: "/images/bronte-harbour-watercolour.webp"
  },
  features: {
    envelopeIntro: true,
    countdown: true,
    mailingForm: false,
    updates: true,
    faq: true,
    ceremonyDetails: false,
    fullSchedule: false,
    formalRsvp: false,
    mealSelection: false,
    transportation: false,
    accommodations: false,
    dressCode: false,
    weddingColours: false,
    menu: false,
    googlePhotos: false,
    kahoot: false,
    analytics: false
  }
} as const;

export type WeddingConfig = typeof weddingConfig;
