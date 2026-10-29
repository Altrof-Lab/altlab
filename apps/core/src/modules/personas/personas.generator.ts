import { 
  PersonaDto, 
  SocialAccountDto, 
  PersonaInterestAffinityDto, 
  INTEREST_CATEGORIES, 
  InterestCategoryCode,
  YouTubeChannelDto,
  AffiliateAccountDto
} from '@altlab/shared';
import { GeneratePersonaOptions } from './personas.types';

const ESTONIAN_MALE_NAMES = [
  'Jaan', 'Toomas', 'Mart', 'Andres', 'Rasmus', 
  'Sander', 'Margus', 'Peeter', 'Mihkel', 'Siim', 
  'Kaspar', 'Kristjan', 'Indrek', 'Tarmo', 'Oliver'
];

const ESTONIAN_FEMALE_NAMES = [
  'Laura', 'Katrin', 'Liis', 'Kadri', 'Maria', 
  'Kristiina', 'Triin', 'Anneli', 'Sandra', 'Helen', 
  'Kersti', 'Anu', 'Piret', 'Kertu', 'Hanna'
];

const ESTONIAN_SURNAMES = [
  'Tamm', 'Saar', 'Sepp', 'Mägi', 'Kallas', 
  'Kukk', 'Rebane', 'Ilves', 'Pärn', 'Kivi', 
  'Oja', 'Lepik', 'Raudsepp', 'Kuusk', 'Kaasik'
];

interface EstonianCityMeta {
  city: string;
  zipCodes: string[];
  streets: string[];
}

const ESTONIAN_CITIES: EstonianCityMeta[] = [
  {
    city: 'Tallinn',
    zipCodes: ['10115', '10145', '10412', '10614', '11314'],
    streets: ['Tartu mnt', 'Pärnu mnt', 'Narva mnt', 'Liivalaia tn', 'Telliskivi tn', 'Rävala pst', 'Viru tn'],
  },
  {
    city: 'Tartu',
    zipCodes: ['50106', '51003', '51014'],
    streets: ['Riia mnt', 'Turu tn', 'Ülikooli tn', 'Raatuse tn', 'Aleksandri tn'],
  },
  {
    city: 'Pärnu',
    zipCodes: ['80010', '80034'],
    streets: ['Rüütli tn', 'Ringi tn', 'Supeluse tn', 'Aia tn'],
  },
  {
    city: 'Narva',
    zipCodes: ['20308', '20309'],
    streets: ['Tallinna mnt', 'Puškini tn', 'Kreenholmi tn', 'Kangelaste pr'],
  },
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateEstonianPersona(options?: GeneratePersonaOptions): PersonaDto {
  const gender = options?.gender || (Math.random() > 0.5 ? 'MALE' : 'FEMALE');
  const firstName = gender === 'MALE' 
    ? getRandomElement(ESTONIAN_MALE_NAMES) 
    : getRandomElement(ESTONIAN_FEMALE_NAMES);
  const lastName = getRandomElement(ESTONIAN_SURNAMES);

  const minAge = options?.minAge || 22;
  const maxAge = options?.maxAge || 52;
  const age = getRandomInt(minAge, maxAge);

  const currentYear = 2026;
  const birthYear = currentYear - age;
  const birthMonth = String(getRandomInt(1, 12)).padStart(2, '0');
  const birthDay = String(getRandomInt(1, 28)).padStart(2, '0');
  const birthDate = `${birthYear}-${birthMonth}-${birthDay}`;

  const cityMeta = getRandomElement(ESTONIAN_CITIES);
  const street = getRandomElement(cityMeta.streets);
  const houseNumber = getRandomInt(1, 95);
  const aptNumber = getRandomInt(1, 48);
  const zipCode = getRandomElement(cityMeta.zipCodes);
  const address = `${street} ${houseNumber}-${aptNumber}, ${zipCode} ${cityMeta.city}`;

  const cleanFirst = firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleanLast = lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const emailDomain = Math.random() > 0.35 ? 'gmail.com' : 'mail.ee';
  const email = `${cleanFirst}.${cleanLast}${String(birthYear).slice(2)}@${emailDomain}`;
  const phone = `+372 5${getRandomInt(1000000, 9999999)}`;

  // Generate Behavioral Affinity Vector (Total = 100%)
  const shuffledCategories = [...INTEREST_CATEGORIES].sort(() => 0.5 - Math.random());
  const primaryCat = shuffledCategories[0];
  const sec1Cat = shuffledCategories[1];
  const sec2Cat = shuffledCategories[2];

  const primaryWeight = getRandomInt(45, 60);
  const sec1Weight = getRandomInt(20, 100 - primaryWeight - 10);
  const sec2Weight = 100 - primaryWeight - sec1Weight;

  const interests: PersonaInterestAffinityDto[] = [
    { categoryCode: primaryCat.code, categoryName: primaryCat.name, weight: primaryWeight },
    { categoryCode: sec1Cat.code, categoryName: sec1Cat.name, weight: sec1Weight },
    { categoryCode: sec2Cat.code, categoryName: sec2Cat.name, weight: sec2Weight },
  ];

  const personaId = `per-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const fbSocialId = `soc-fb-${Math.random().toString(36).substring(2, 8)}`;
  const googleSocialId = `soc-goog-${Math.random().toString(36).substring(2, 8)}`;

  // 1:N YouTube channels under Google account
  const youtubeChannels: YouTubeChannelDto[] = [
    {
      id: `yt-${Math.random().toString(36).substring(2, 8)}`,
      name: `${firstName} ${lastName} ${primaryCat.name.split(' ')[0]}`,
      channelUrl: `https://youtube.com/@${cleanFirst}${cleanLast}`,
      subscribersCount: getRandomInt(85, 3200),
    },
  ];

  // 1:N Ad accounts under Google account
  const googleAdAccounts: AffiliateAccountDto[] = [
    {
      id: `acc-gads-${Date.now() + 1}`,
      platform: 'Google Ads',
      accountName: `GAds_${lastName}_${primaryCat.code}`,
      accountId: `${getRandomInt(100, 999)}-${getRandomInt(100, 999)}-${getRandomInt(1000, 9999)}`,
      status: 'active',
      balance: getRandomInt(2000, 8000),
      dailySpend: getRandomInt(250, 750),
      currency: 'EUR',
      personaId,
      personaName: `${firstName} ${lastName}`,
      socialAccountId: googleSocialId,
      socialAccountPlatform: 'google',
      socialAccountName: `${firstName} ${lastName}`,
      createdAt: new Date().toISOString(),
    },
  ];

  // 1:N Ad accounts under Facebook account
  const fbAdAccounts: AffiliateAccountDto[] = [
    {
      id: `acc-fb-${Date.now() + 2}`,
      platform: 'Facebook Ads',
      accountName: `FB_${lastName}_Main`,
      accountId: `act_${getRandomInt(100000000, 999999999)}`,
      status: 'active',
      balance: getRandomInt(1500, 6000),
      dailySpend: getRandomInt(300, 900),
      currency: 'EUR',
      personaId,
      personaName: `${firstName} ${lastName}`,
      socialAccountId: fbSocialId,
      socialAccountPlatform: 'facebook',
      socialAccountName: `@${cleanFirst}.${cleanLast}.ee`,
      createdAt: new Date().toISOString(),
    },
  ];

  const socialAccounts: SocialAccountDto[] = [
    {
      id: googleSocialId,
      personaId,
      platform: 'google',
      username: `${cleanFirst}.${cleanLast}`,
      displayName: `${firstName} ${lastName}`,
      email,
      profileUrl: `https://myaccount.google.com/`,
      status: 'active',
      has2fa: true,
      twoFactorType: 'totp',
      twoFactorSecret: 'HXDMVJECJJWSRB3H',
      loggedInProfileIds: [],
      youtubeChannels,
      adAccounts: googleAdAccounts,
      createdAt: new Date().toISOString(),
    },
    {
      id: fbSocialId,
      personaId,
      platform: 'facebook',
      username: `${cleanFirst}.${cleanLast}.ee`,
      displayName: `${firstName} ${lastName}`,
      email,
      profileUrl: `https://facebook.com/${cleanFirst}.${cleanLast}.ee`,
      status: 'farmed',
      has2fa: Math.random() > 0.35,
      twoFactorType: 'totp',
      twoFactorSecret: 'JBSWY3DPEHPK3PXP',
      loggedInProfileIds: [],
      adAccounts: fbAdAccounts,
      createdAt: new Date().toISOString(),
    },
  ];

  const avatarUrl = gender === 'MALE'
    ? `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80`
    : `https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80`;

  return {
    id: personaId,
    firstName,
    lastName,
    gender,
    age,
    birthDate,
    avatarUrl,
    countryCode: 'EE',
    country: 'Estonia',
    city: cityMeta.city,
    address,
    timezone: 'Europe/Tallinn',
    locale: 'et-EE, et;q=0.9, en;q=0.8',
    email,
    phone,
    interests,
    socialAccounts,
    linkedProfileIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
