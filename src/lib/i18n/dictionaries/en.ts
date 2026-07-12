// UI copy dictionary for /en. Product names/descriptions are not translated here —
// they come directly from the DB's name_en/wood_species_en columns.
const en = {
  common: {
    siteName: 'Hagurumado',
    products: 'Shop',
    cart: 'Cart',
    login: 'Log in',
    switchLanguage: '日本語',
  },
  footer: {
    guide: 'Guide',
    tokushoho: 'Legal Notice',
    privacy: 'Privacy Policy',
    rights: 'Hagurumado Zaikusho',
  },
  home: {
    brandStatement: 'Handcrafted pen grips shaped by traditional Japanese aesthetics and natural wood.',
    brandSubtext:
      'Each grip is carved by hand from a single piece of wood, celebrating the natural character of the material.',
    ctaShop: 'Browse the shop',
    featuredHeading: 'Our Lineup',
    noProducts: 'No products are published yet.',
  },
  status: {
    acceptingTrue: 'We are currently accepting orders',
    acceptingFalse: 'Orders are temporarily paused',
    waitWeeksPrefix: 'Current estimated wait: about',
    waitWeeksSuffix: 'weeks',
    waitWeeksUnknown: 'Estimated wait time is not available yet',
  },
} as const

export default en
