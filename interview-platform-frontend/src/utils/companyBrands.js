/**
 * Authentic Company Branding Data (Logos, Taglines, and Descriptions)
 * Vector SVGs are self-contained inline Data URIs ensuring 100% offline reliability,
 * zero broken images, and crisp rendering on any screen density.
 */

export const COMPANY_BRANDS = {
  google: {
    name: 'Google',
    tagline: "Organizing the world's information and making it universally accessible and useful.",
    description:
      "Global technology leader specializing in internet-related services, search engine technology, cloud computing (Google Cloud Platform), quantum computing, artificial intelligence (Gemini), and mobile software (Android).",
    brandColor: '#4285F4',
    logoSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="%23EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="%234285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="%23FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="%2334A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`,
  },

  oracle: {
    name: 'Oracle',
    tagline: 'Transforming business with world-class cloud infrastructure and database platforms.',
    description:
      'Enterprise software giant pioneering relational database management systems, Oracle Cloud Infrastructure (OCI), enterprise resource planning (ERP), and developer runtime platforms including Java and MySQL.',
    brandColor: '#F80000',
    logoSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 40"><rect width="160" height="40" rx="8" fill="%23F80000"/><text x="80" y="27" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="22" font-weight="900" fill="%23ffffff" text-anchor="middle" letter-spacing="3">ORACLE</text></svg>`,
  },

  microsoft: {
    name: 'Microsoft',
    tagline: 'Empowering every person and every organization on the planet to achieve more.',
    description:
      'Pioneer of Windows, Azure cloud computing platform, Microsoft 365, GitHub, LinkedIn, and cutting-edge artificial intelligence infrastructure driving enterprise transformation worldwide.',
    brandColor: '#00A4EF',
    logoSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="%23F25022" d="M2 2h20v20H2z"/><path fill="%237FBA00" d="M26 2h20v20H26z"/><path fill="%2300A4EF" d="M2 26h20v20H2z"/><path fill="%23FFB900" d="M26 26h20v20H26z"/></svg>`,
  },

  amazon: {
    name: 'Amazon',
    tagline: "Earth's most customer-centric company, building cloud and logistics of tomorrow.",
    description:
      'Global ecommerce leader and creator of Amazon Web Services (AWS), the world’s most comprehensive and broadly adopted cloud platform powering millions of customers and tech enterprises.',
    brandColor: '#FF9900',
    logoSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="%23232F3E"/><path d="M12 28c4 4 15 6 24 0" stroke="%23FF9900" stroke-width="3.5" stroke-linecap="round" fill="none"/><path d="M34 26l3 2-3 2" stroke="%23FF9900" stroke-width="3" stroke-linecap="round" fill="none"/><text x="24" y="22" font-family="-apple-system,sans-serif" font-size="16" font-weight="900" fill="%23ffffff" text-anchor="middle">a</text></svg>`,
  },

  apple: {
    name: 'Apple',
    tagline: 'Think different. Seamless integration of hardware, software, and services.',
    description:
      'Global innovator designing iPhone, Mac, iPad, Apple Silicon processors, iOS, and world-class digital service ecosystems renowned for exceptional design craftsmanship and user privacy.',
    brandColor: '#A2AAAD',
    logoSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 170"><path fill="%23334155" d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.3-9.56-11.3-20.57-15-33.02-3.7-12.46-5.55-23.77-5.55-33.95 0-14.54 3.73-26.68 11.19-36.42 7.46-9.74 16.89-14.71 28.3-14.93 4.12 0 9.07 1.13 14.86 3.38 5.79 2.26 9.8 3.44 12.04 3.53 1.74 0 6.08-1.28 13.02-3.83 6.94-2.55 12.63-3.64 17.08-3.26 12.83.65 23.11 5.38 30.85 14.19-11.3 6.85-16.84 16.3-16.63 28.37.22 9.56 3.86 17.55 10.93 23.97 7.07 6.41 15.65 10.16 25.76 11.25-2.07 6.3-4.51 12.83-7.33 19.57zM119.22 31.84c0-7.39 2.66-14.3 7.98-20.73 5.32-6.43 11.83-10.45 19.53-12.06.33 1.41.49 2.77.49 4.07 0 7.39-2.82 14.57-8.47 21.52-5.65 6.95-12.44 11.09-20.37 12.42-.43-1.63-.66-3.23-.66-4.82z"/></svg>`,
  },

  meta: {
    name: 'Meta',
    tagline: 'Giving people the power to build community and bring the world closer together.',
    description:
      'Creator of Facebook, Instagram, WhatsApp, and Quest VR, pioneering the future of connection, PyTorch deep learning framework, and open source AI models like Llama.',
    brandColor: '#0081FB',
    logoSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="%230081FB"/><path d="M12 28c0-5 3-10 6.5-10 4 0 6 6 7.5 9 1.5-3 3.5-9 7.5-9 3.5 0 6.5 5 6.5 10s-2.5 8-5.5 8c-3.5 0-5.5-4-7.5-8-2 4-4 8-7.5 8-3 0-5.5-3.5-5.5-8z" stroke="%23ffffff" stroke-width="3" fill="none"/></svg>`,
  },

  netflix: {
    name: 'Netflix',
    tagline: 'Entertaining the world with great stories across languages and borders.',
    description:
      'Premier streaming entertainment service operating at massive global scale, renowned for microservice architecture, Chaos Engineering, and resilient distributed cloud infrastructure.',
    brandColor: '#E50914',
    logoSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="%23141414"/><path d="M14 10v28h5V22l10 16h5V10h-5v16l-10-16z" fill="%23E50914"/></svg>`,
  },

  uber: {
    name: 'Uber',
    tagline: 'Reimagining the way the world moves for the better.',
    description:
      'Global mobility and delivery platform processing millions of real-time transactions daily, built on high-throughput distributed systems, geospatial indexing, and real-time machine learning.',
    brandColor: '#000000',
    logoSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="%23000000"/><text x="24" y="30" font-family="-apple-system,BlinkMacSystemFont,sans-serif" font-size="14" font-weight="900" fill="%23ffffff" text-anchor="middle" letter-spacing="1">Uber</text></svg>`,
  },

  stripe: {
    name: 'Stripe',
    tagline: 'Financial infrastructure for the internet.',
    description:
      'Developer-first financial infrastructure suite powering payments, billing, and global commerce for ambitious online businesses ranging from startups to Fortune 50 enterprises.',
    brandColor: '#635BFF',
    logoSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="%23635BFF"/><text x="24" y="32" font-family="-apple-system,sans-serif" font-size="28" font-weight="900" fill="%23ffffff" text-anchor="middle">S</text></svg>`,
  },

  airbnb: {
    name: 'Airbnb',
    tagline: 'Belong anywhere. Creating a world where anyone can feel at home.',
    description:
      'Revolutionary community marketplace connecting millions of hosts and travelers across 220+ countries, built on modern React frontend architecture and large-scale search infrastructure.',
    brandColor: '#FF5A5F',
    logoSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="%23FF5A5F"/><path d="M24 10c-5 0-8 6-6 12 2 5 6 12 6 16 0-4 4-11 6-16 2-6-1-12-6-12zm0 18a3 3 0 110-6 3 3 0 010 6z" fill="%23ffffff"/></svg>`,
  },

  spotify: {
    name: 'Spotify',
    tagline: 'Unlocking the potential of human creativity by giving music to everyone.',
    description:
      'Global audio streaming platform powering 600M+ active users, renowned for audio recommendation algorithms, decentralized squad engineering culture, and event-driven architecture.',
    brandColor: '#1DB954',
    logoSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="%231DB954"/><circle cx="24" cy="24" r="16" fill="%231DB954"/><path d="M16 19c6-1 12 0 17 3M17 24c5-1 10 0 14 2M18 29c4-.8 8 0 11 2" stroke="%23ffffff" stroke-width="3" stroke-linecap="round" fill="none"/></svg>`,
  },

  adobe: {
    name: 'Adobe',
    tagline: 'Changing the world through digital experiences.',
    description:
      'Global leader in creative software including Photoshop, Illustrator, Premiere, Acrobat, and Adobe Firefly generative AI, powering designers and enterprise content workflows.',
    brandColor: '#FF0000',
    logoSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="%23FA0F00"/><path d="M12 12h8l7 20h-6l-2-6h-7zM28 12h8l7 24h-6l-2-6h-7z" fill="%23ffffff"/></svg>`,
  },

  github: {
    name: 'GitHub',
    tagline: 'The AI-powered developer platform to build, scale, and deliver secure software.',
    description:
      'The world’s home for 100M+ developers, hosting Git version control, GitHub Copilot AI pair programming, CI/CD Actions, and open-source collaboration across the globe.',
    brandColor: '#181717',
    logoSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="%2324292e"/><path fill="%23ffffff" fill-rule="evenodd" d="M24 10a14 14 0 00-4.4 27.3c.7.1 1-.3 1-.7v-2.4c-3.9.8-4.7-1.9-4.7-1.9-.6-1.6-1.5-2-1.5-2-1.3-.9.1-.9.1-.9 1.4.1 2.2 1.5 2.2 1.5 1.3 2.2 3.3 1.5 4.1 1.2.1-.9.5-1.5.9-1.9-3.1-.4-6.4-1.6-6.4-7 0-1.5.5-2.8 1.4-3.8-.1-.4-.6-1.8.2-3.7 0 0 1.2-.4 3.9 1.5a13.5 13.5 0 017 0c2.7-1.9 3.9-1.5 3.9-1.5.8 1.9.3 3.3.1 3.7.9 1 1.4 2.3 1.4 3.8 0 5.4-3.3 6.6-6.4 7 .5.4 1 1.3 1 2.6v3.8c0 .4.3.8 1 .7A14 14 0 0024 10z"/></svg>`,
  },

  salesforce: {
    name: 'Salesforce',
    tagline: 'Connecting companies and customers from anywhere with the worlds #1 CRM.',
    description:
      'Global pioneer in cloud-based customer relationship management (CRM), sales automation, service cloud, and enterprise AI agents uniting sales, service, and marketing teams.',
    brandColor: '#00A1E0',
    logoSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="%2300A1E0"/><text x="24" y="28" font-family="-apple-system,sans-serif" font-size="12" font-weight="900" fill="%23ffffff" text-anchor="middle">CRM</text></svg>`,
  },

  nvidia: {
    name: 'NVIDIA',
    tagline: 'Pioneering accelerated computing to tackle challenges no one else can solve.',
    description:
      'World leader in graphics processing units (GPUs), CUDA architecture, and accelerated data center compute infrastructure driving the global generative AI and deep learning revolution.',
    brandColor: '#76B900',
    logoSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="%23000000"/><path d="M14 26c0-6 5-11 11-11 4 0 7 2 9 5-2 1-5 2-8 2-4 0-6 2-6 5s3 5 7 5c2 0 5-1 7-2 0 4-4 8-10 8-6 0-10-5-10-12z" fill="%2376B900"/></svg>`,
  },

  linkedin: {
    name: 'LinkedIn',
    tagline: 'Connect the worlds professionals to make them more productive and successful.',
    description:
      'The worlds largest professional network with 1B+ members, connecting talent with opportunity and driving enterprise hiring, learning, and business sales solutions.',
    brandColor: '#0A66C2',
    logoSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="%230A66C2"/><text x="24" y="32" font-family="-apple-system,sans-serif" font-size="24" font-weight="800" fill="%23ffffff" text-anchor="middle">in</text></svg>`,
  },

  paypal: {
    name: 'PayPal',
    tagline: 'Empowering digital commerce and financial security across the globe.',
    description:
      'Global digital payments leader providing secure money transfers, merchant checkout systems, and merchant payment processing for hundreds of millions of consumers and businesses.',
    brandColor: '#003087',
    logoSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="%23003087"/><text x="24" y="33" font-family="-apple-system,sans-serif" font-size="26" font-weight="900" fill="%230079C1" text-anchor="middle">P</text></svg>`,
  },

  cognizant: {
    name: 'Cognizant',
    tagline: 'Engineering modern businesses to improve everyday life.',
    description:
      'Leading multinational provider of information technology, consulting, and business process services helping global clients modernize technology and reimagine processes.',
    brandColor: '#0033A0',
    logoSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="%230033A0"/><text x="24" y="31" font-family="-apple-system,sans-serif" font-size="20" font-weight="900" fill="%23ffffff" text-anchor="middle">CTS</text></svg>`,
  },
}

/**
 * Generate a consistent, attractive color based on string hash
 */
export function getHashColor(name = '') {
  const colors = [
    '#2563eb', '#059669', '#7c3aed', '#d97706', '#db2777',
    '#0891b2', '#4f46e5', '#0d9488', '#ea580c', '#65a30d'
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

/**
 * Look up official brand info from known registry by name
 */
export function findKnownBrand(companyName = '') {
  const rawName = String(companyName || '').toLowerCase().trim()
  if (!rawName) return null

  let key = null
  if (rawName.includes('google')) key = 'google'
  else if (rawName.includes('oracle')) key = 'oracle'
  else if (rawName.includes('microsoft')) key = 'microsoft'
  else if (rawName.includes('apple')) key = 'apple'
  else if (rawName.includes('amazon') || rawName.includes('aws')) key = 'amazon'
  else if (rawName.includes('meta') || rawName.includes('facebook')) key = 'meta'
  else if (rawName.includes('netflix')) key = 'netflix'
  else if (rawName.includes('uber')) key = 'uber'
  else if (rawName.includes('stripe')) key = 'stripe'
  else if (rawName.includes('airbnb')) key = 'airbnb'
  else if (rawName.includes('spotify')) key = 'spotify'
  else if (rawName.includes('adobe')) key = 'adobe'
  else if (rawName.includes('github')) key = 'github'
  else if (rawName.includes('salesforce')) key = 'salesforce'
  else if (rawName.includes('nvidia')) key = 'nvidia'
  else if (rawName.includes('linkedin')) key = 'linkedin'
  else if (rawName.includes('paypal')) key = 'paypal'
  else if (rawName.includes('cognizant')) key = 'cognizant'

  return key ? COMPANY_BRANDS[key] : null
}

/**
 * Automatically searches and resolves a company logo online / from brand registry.
 * 1. Checks matching known tech brand vectors (instant high-res SVG)
 * 2. Extracts domain from website URL or derives it from company name
 * 3. Uses official unavatar.io service which queries Clearbit, DuckDuckGo, Twitter, and Google Favicons
 * 4. Fallback: Creates an inline SVG monogram avatar with the company's brand color
 */
export function resolveCompanyLogoOnline(name = '', website = '') {
  const cleanName = String(name || '').trim()
  if (!cleanName) return null

  // 1. Check known brand vector SVGs directly (no circular recursion)
  const brand = findKnownBrand(cleanName)
  if (brand && brand.logoSvg) {
    return brand.logoSvg
  }

  // 2. Extract domain from website or company name
  let domain = ''
  if (website && website.trim()) {
    try {
      let rawUrl = website.trim()
      if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
        rawUrl = 'https://' + rawUrl
      }
      const parsed = new URL(rawUrl)
      domain = parsed.hostname.replace(/^www\./, '')
    } catch {
      const m = website.match(/([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/)
      if (m) domain = m[1]
    }
  }

  if (!domain && cleanName) {
    const simplified = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (simplified) {
      domain = `${simplified}.com`
    }
  }

  if (domain) {
    // Unavatar automatically looks up the brand logo online across multiple providers
    return `https://unavatar.io/${domain}?fallback=https://www.google.com/s2/favicons?domain=${domain}&sz=128`
  }

  // 3. Fallback: Crisp SVG monogram badge data URI
  const initials =
    cleanName
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('') || cleanName[0]?.toUpperCase() || 'C'
  const color = getHashColor(cleanName)
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="20" fill="${encodeURIComponent(color)}"/><text x="50" y="62" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="42" font-weight="700" fill="%23ffffff" text-anchor="middle">${encodeURIComponent(initials)}</text></svg>`
}

/**
 * Enriches a company object with authentic brand data (logo, tagline, description).
 * Seamlessly handles variations like "Amazon Web Services Inc", "Microsoft Corporation", etc.
 */
export function getCompanyBrand(company) {
  if (!company) return { name: '', logo: null, description: '', tagline: '', brandColor: '#2563eb' }

  // Support string or object
  const comp = typeof company === 'string' ? { name: company } : { ...company }
  const cleanName = String(comp.name || '').trim()
  const brand = findKnownBrand(cleanName)

  // Check if existing logo is valid or a broken placeholder
  const isPlaceholderOrBroken =
    !comp.logo ||
    comp.logo.includes('example.com') ||
    comp.logo.includes('placeholder') ||
    comp.logo.trim() === ''

  let resolvedLogo = null
  if (!isPlaceholderOrBroken) {
    resolvedLogo = comp.logo
  } else if (brand && brand.logoSvg) {
    resolvedLogo = brand.logoSvg
  } else if (comp.website || cleanName) {
    resolvedLogo = resolveCompanyLogoOnline(cleanName, comp.website)
  }

  // Prioritize authentic description if backend description is generic or missing
  const isGenericDescription =
    !comp.description ||
    comp.description.includes('Global tech company') ||
    comp.description.includes('Multinational technology company') ||
    comp.description.includes('Multinational computer technology company') ||
    comp.description.trim().length < 40

  const resolvedDescription =
    isGenericDescription && brand ? brand.description : comp.description || (brand ? brand.description : '')

  const resolvedTagline = brand ? brand.tagline : ''
  const resolvedColor = brand ? brand.brandColor : getHashColor(comp.name || '')

  return {
    ...comp,
    name: comp.name || (brand ? brand.name : 'Company'),
    logo: resolvedLogo,
    description: resolvedDescription,
    tagline: resolvedTagline,
    brandColor: resolvedColor,
  }
}

export default getCompanyBrand
