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

export interface SpyhubNodeStatusDto {
  nodeUrl: string;
  nodeName: string;
  os: 'macos' | 'windows' | 'linux' | string;
  status: 'online' | 'offline';
  responseTimeMs?: number;
  profileCount: number;
}

export interface StealthServiceResult {
  serviceName: 'Browserleaks.net' | 'CreepJS' | 'Iphey' | 'Pixelscan' | 'Bot.sannysoft.com' | string;
  statusCode: 'PASSED' | 'FAILED' | 'FLAGGED';
  trustScore: number; // 0 - 100
  failedParameters?: string[];
}

export interface StealthAuditVerdictDto {
  processInstanceId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  overallTrustScore: number; // 0 - 100
  overallStatus: 'PASSED' | 'WARNING' | 'FAILED';
  criticalFailureDetected: boolean;
  results: StealthServiceResult[];
  lastAuditedAt: string;
}

export interface CookieFarmStatusDto {
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  cookiesCount: number;
  sitesVisitedCount: number;
  lastFarmedAt: string;
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
  stealthAudit?: StealthAuditVerdictDto;
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
  browserProfileId?: string;
  browserProfileName?: string;
  stealthTrustScore?: number;
  createdAt: string;
}

export interface CreateAffiliateAccountDto {
  platform: AffiliatePlatform;
  accountName: string;
  accountId: string;
  proxyIp?: string;
  browserProfileId?: string;
  currency: string;
}
