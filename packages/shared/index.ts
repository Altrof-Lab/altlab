// Shared DTOs, schemas, and API contracts between apps/core and apps/dashboard

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: string;
}

export interface ServerStatusDto {
  id: string;
  name: string;
  ip: string;
  status: 'online' | 'offline' | 'degraded';
  uptimeSeconds: number;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  containersCount: number;
  virtualMachinesCount: number;
}

export type AffiliatePlatform = 'Facebook Ads' | 'Google Ads' | 'TikTok Ads' | 'Bing Ads' | 'Taboola' | 'Outbrain' | 'Custom Network';
export type AccountStatus = 'active' | 'paused' | 'banned' | 'in_review';

export type InterestCategoryCode =
  | 'FINANCE'
  | 'E_COMMERCE'
  | 'TECH'
  | 'TRAVEL'
  | 'FASHION'
  | 'HEALTH'
  | 'REAL_ESTATE'
  | 'BUSINESS'
  | 'EDUCATION'
  | 'LIFESTYLE'
  | 'HOME'
  | 'FOOD'
  | 'ENTERTAINMENT'
  | 'NEWS'
  | 'SPORT'
  | 'GAMING';

export interface InterestCategoryDto {
  code: InterestCategoryCode;
  name: string;
  description: string;
  defaultWeight: number;
}

export const INTEREST_CATEGORIES: InterestCategoryDto[] = [
  { code: 'FINANCE', name: 'Finance & Investing', description: 'Banking, insurance, loans, investments, savings, personal finance tools.', defaultWeight: 10 },
  { code: 'E_COMMERCE', name: 'Online Shopping', description: 'Online stores and marketplaces: shopping, product deals, discounts, delivery.', defaultWeight: 10 },
  { code: 'TECH', name: 'Technology & IT', description: 'Technology news, software, gadgets, telecom, cybersecurity, cloud and IT services.', defaultWeight: 7 },
  { code: 'TRAVEL', name: 'Travel & Tourism', description: 'Trips, flights, hotels, rentals, destinations, travel tips, tourism services.', defaultWeight: 8 },
  { code: 'FASHION', name: 'Fashion & Beauty', description: 'Clothing, shoes, accessories, cosmetics, beauty trends, personal styling.', defaultWeight: 4 },
  { code: 'HEALTH', name: 'Health & Wellness', description: 'Healthcare, clinics, supplements, wellness, recovery, nutrition and wellbeing.', defaultWeight: 6 },
  { code: 'REAL_ESTATE', name: 'Real Estate', description: 'Buying, selling and renting property, real estate listings, agencies and projects.', defaultWeight: 7 },
  { code: 'BUSINESS', name: 'Business & Entrepreneurship', description: 'Entrepreneurship, startups, online business, marketing, payments, tools.', defaultWeight: 5 },
  { code: 'EDUCATION', name: 'Education & Learning', description: 'Universities, online courses, training platforms, learning resources and skills.', defaultWeight: 4 },
  { code: 'LIFESTYLE', name: 'Lifestyle', description: 'Daily life and relationships: family, dating, weddings, life hacks, local activities.', defaultWeight: 5 },
  { code: 'HOME', name: 'Home & DIY', description: 'Home improvement, DIY projects, tools, interior/exterior design, renovation.', defaultWeight: 5 },
  { code: 'FOOD', name: 'Food & Cooking', description: 'Groceries, recipes, cooking, restaurants, food delivery, nutrition products.', defaultWeight: 3 },
  { code: 'ENTERTAINMENT', name: 'Entertainment & Leisure', description: 'Movies, TV, books, music, events, tickets, streaming and leisure activities.', defaultWeight: 5 },
  { code: 'NEWS', name: 'News & Media', description: 'News portals, media outlets, journalism, politics, economy and current events.', defaultWeight: 9 },
  { code: 'SPORT', name: 'Sports & Fitness', description: 'Sport news, clubs, gym, training, fitness lifestyle and active recreation.', defaultWeight: 5 },
  { code: 'GAMING', name: 'Gaming & Esports', description: 'Video games, esports, game communities, streaming, gaming platforms and news.', defaultWeight: 2 },
];

export interface PersonaInterestAffinityDto {
  categoryCode: InterestCategoryCode;
  categoryName: string;
  weight: number; // 0 - 100 percentage
}

export interface YouTubeChannelDto {
  id: string;
  name: string;
  channelUrl?: string;
  subscribersCount?: number;
}

export type SocialPlatform = 'facebook' | 'google' | 'tiktok' | 'twitter' | 'custom';
export type SocialAccountStatus = 'active' | 'farmed' | 'suspended' | 'pending';

export interface LoggedInBrowserDto {
  profileId: string;
  browserType: 'camoufox' | 'cloak' | string;
  profileName?: string;
}

export type TwoFactorType = 'totp' | 'sms' | 'email' | 'none';

export interface SocialAccountDto {
  id: string;
  personaId: string;
  platform: SocialPlatform;
  username: string;
  displayName: string;
  email?: string;
  profileUrl?: string;
  status: SocialAccountStatus;
  has2fa?: boolean;
  twoFactorType?: TwoFactorType;
  twoFactorSecret?: string; // Base32 TOTP secret for live 2FA code generation
  loggedInProfileIds: string[]; // M:N - Browser profile IDs where this account is logged in
  adAccounts?: AffiliateAccountDto[]; // 1:N - Ad accounts created under this social account
  youtubeChannels?: YouTubeChannelDto[]; // 1:N - YouTube channels (for Google platform)
  createdAt: string;
}

export interface PersonaDto {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  age: number;
  birthDate: string;
  avatarUrl?: string;

  // Geo (Default: Estonia)
  countryCode: string; // 'EE'
  country: string; // 'Estonia'
  city: string; // 'Tallinn'
  address: string;
  timezone: string; // 'Europe/Tallinn'
  locale: string; // 'et-EE,en;q=0.9'

  // Contact
  email: string;
  phone: string;

  // Interests & Affinity (feeds into BotForge Cookie Farm)
  interests: PersonaInterestAffinityDto[];

  // Social accounts (Google, Facebook, etc.)
  socialAccounts: SocialAccountDto[];

  // Linked browser profiles (Devices)
  linkedProfileIds: string[];

  createdAt: string;
  updatedAt: string;
}

export interface CreateSocialAccountInputDto {
  platform: SocialPlatform;
  username: string;
  displayName?: string;
  email?: string;
  status?: SocialAccountStatus;
  has2fa?: boolean;
  twoFactorType?: TwoFactorType;
  twoFactorSecret?: string;
}

export interface CreatePersonaDto {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  age?: number;
  birthDate?: string;
  avatarUrl?: string;
  countryCode?: string;
  country?: string;
  city?: string;
  address?: string;
  timezone?: string;
  locale?: string;
  email?: string;
  phone?: string;
  interests?: PersonaInterestAffinityDto[];
  socialAccounts?: CreateSocialAccountInputDto[];
}

export interface UpdatePersonaDto extends Partial<CreatePersonaDto> {
  linkedProfileIds?: string[];
}

export interface ActiveSocialSessionDto {
  socialAccountId: string;
  platform: SocialPlatform;
  username: string;
  displayName: string;
  personaId?: string;
  personaName?: string;
}

export interface SpyhubNodeConfigDto {
  nodeUrl: string;
  nodeName: string;
  os: 'macos' | 'windows' | 'linux' | string;
}

export interface SpyhubNodeStatusDto {
  nodeUrl: string;
  nodeName: string;
  os: 'macos' | 'windows' | 'linux' | string;
  status: 'online' | 'offline';
  responseTimeMs?: number;
  profileCount: number;
}

export interface SingleNodeDataDto {
  nodeStatus: SpyhubNodeStatusDto;
  profiles: BrowserProfileDto[];
}

export interface ProfileSummaryDto {
  profileId: string;
  overallTrustScore: number;
  overallStatus: 'PASSED' | 'WARNING' | 'FAILED' | string;
  cookiesCount: number;
  sitesVisitedCount: number;
}

export interface ProfileSummaryRequestDto {
  profileIds: string[];
}

export interface StealthServiceResult {
  serviceName: 'Browserleaks.net' | 'CreepJS' | 'Iphey' | 'Pixelscan' | 'Bot.sannysoft.com' | string;
  statusCode: 'PASSED' | 'FAILED' | 'FLAGGED';
  trustScore: number; // 0 - 100
  failedParameters?: string[];
  report?: any;
}

export interface StealthAuditVerdictDto {
  auditId?: string;
  processInstanceId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  overallTrustScore: number; // 0 - 100
  overallStatus: 'PASSED' | 'WARNING' | 'FAILED';
  criticalFailureDetected: boolean;
  valid?: boolean;
  results: StealthServiceResult[];
  lastAuditedAt: string;
}

export interface CookieFarmSiteVisitDto {
  siteUrl: string;
  siteName: string;
  category: 'finance' | 'insurance' | 'ecommerce' | 'telecom' | 'travel';
  cookieBannerText?: string;
  dismissalLevel: 'Level 1 (Text)' | 'Level 2 (Selector)' | 'Level 3 (Shadow DOM)' | 'No Banner';
  cookiesCaptured: number;
  durationSeconds: number;
  interactionSummary: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'QUEUED' | 'PENDING' | 'FAILED';
  visitedAt: string;
}

export interface CookieFarmStatusDto {
  status: 'IDLE' | 'PLANNED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  cookiesCount: number;
  sitesVisitedCount: number;
  lastFarmedAt: string;
  recentVisits?: CookieFarmSiteVisitDto[];
  consentSuccessRate?: number;
  totalDurationSeconds?: number;
}

export interface BrowserProfileDto {
  profileId: string;
  name: string;
  browserType: 'camoufox' | 'cloak' | 'chrome' | string;
  os: 'windows' | 'macos' | 'linux' | string;
  proxyIp?: string;
  running: boolean;
  nodeUrl?: string;
  nodeName?: string;
  linkedAccountId?: string;
  linkedAccountName?: string;
  personaId?: string;
  personaName?: string;
  activeSocialSessions?: ActiveSocialSessionDto[];
  stealthAudit?: StealthAuditVerdictDto;
  stealthAuditHistory?: StealthAuditVerdictDto[];
  cookieFarm?: CookieFarmStatusDto;
  createdAt: string;
}

export interface AffiliateAccountDto {
  id: string;
  platform: AffiliatePlatform;
  accountName: string;
  accountId: string;
  status: AccountStatus;
  balance: number;
  dailySpend: number;
  currency: string;
  proxyIp?: string;
  personaId?: string;
  personaName?: string;
  socialAccountId?: string;
  socialAccountPlatform?: SocialPlatform;
  socialAccountName?: string;
  stealthTrustScore?: number;
  createdAt: string;
}

export interface CreateAffiliateAccountDto {
  platform: AffiliatePlatform;
  accountName: string;
  accountId: string;
  proxyIp?: string;
  personaId?: string;
  socialAccountId?: string;
  currency: string;
}
