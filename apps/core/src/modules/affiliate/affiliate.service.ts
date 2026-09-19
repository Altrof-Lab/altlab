import { Injectable } from '@nestjs/common';
import { AffiliateAccountDto, CreateAffiliateAccountDto } from '@altlab/shared';

@Injectable()
export class AffiliateService {
  private accounts: AffiliateAccountDto[] = [
    {
      id: 'acc-101',
      platform: 'Facebook Ads',
      accountName: 'FB_Agency_US_01',
      accountId: 'act_48291048102',
      status: 'active',
      balance: 4500.0,
      dailySpend: 1250.5,
      currency: 'USD',
      proxyIp: '185.220.101.45:8080',
      createdAt: '2026-09-01T10:00:00Z',
    },
    {
      id: 'acc-102',
      platform: 'Google Ads',
      accountName: 'G_Search_Crypto_EU',
      accountId: '918-204-1182',
      status: 'active',
      balance: 12800.0,
      dailySpend: 3400.0,
      currency: 'USD',
      proxyIp: '194.165.16.8:3128',
      createdAt: '2026-09-05T14:30:00Z',
    },
    {
      id: 'acc-103',
      platform: 'TikTok Ads',
      accountName: 'TT_Nutra_DE',
      accountId: 'tt_adv_7829104',
      status: 'in_review',
      balance: 1200.0,
      dailySpend: 450.0,
      currency: 'EUR',
      proxyIp: '45.142.122.90:8000',
      createdAt: '2026-09-12T09:15:00Z',
    },
    {
      id: 'acc-104',
      platform: 'Taboola',
      accountName: 'Native_News_Campaigns',
      accountId: 'tb_592810',
      status: 'paused',
      balance: 850.0,
      dailySpend: 0.0,
      currency: 'USD',
      createdAt: '2026-08-20T11:00:00Z',
    },
  ];

  getAccounts(): AffiliateAccountDto[] {
    return this.accounts;
  }

  createAccount(dto: CreateAffiliateAccountDto): AffiliateAccountDto {
    const newAcc: AffiliateAccountDto = {
      id: `acc-${Date.now()}`,
      platform: dto.platform,
      accountName: dto.accountName,
      accountId: dto.accountId,
      status: 'active',
      balance: 0.0,
      dailySpend: 0.0,
      currency: dto.currency || 'USD',
      proxyIp: dto.proxyIp,
      createdAt: new Date().toISOString(),
    };
    this.accounts.unshift(newAcc);
    return newAcc;
  }
}
