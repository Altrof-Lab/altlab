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
  createdAt: string;
}

export interface CreateAffiliateAccountDto {
  platform: AffiliatePlatform;
  accountName: string;
  accountId: string;
  proxyIp?: string;
  currency: string;
}
