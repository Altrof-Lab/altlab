import { Injectable, Inject } from '@nestjs/common';
import { AffiliateAccountDto, CreateAffiliateAccountDto } from '@altlab/shared';
import { DRIZZLE_CLIENT, DrizzleClient } from '../../database/database.provider';
import * as schema from '../../database/schema';

@Injectable()
export class AffiliateService {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: DrizzleClient,
  ) {}

  async getAccounts(): Promise<AffiliateAccountDto[]> {
    const rows = await this.db.query.adAccounts.findMany({
      with: {
        persona: true,
        socialAccount: true,
      },
      orderBy: (adAccounts, { desc }) => [desc(adAccounts.createdAt)],
    });

    return rows.map((row) => ({
      id: row.id,
      platform: row.platform,
      accountName: row.accountName,
      accountId: row.accountId,
      status: row.status,
      balance: parseFloat(row.balance) || 0,
      dailySpend: parseFloat(row.dailySpend) || 0,
      currency: row.currency,
      proxyIp: row.proxyIp || undefined,
      personaId: row.personaId || undefined,
      personaName: row.persona ? `${row.persona.firstName} ${row.persona.lastName}` : undefined,
      socialAccountId: row.socialAccountId || undefined,
      socialAccountPlatform: row.socialAccount?.platform,
      socialAccountName: row.socialAccount?.displayName,
      createdAt: row.createdAt?.toISOString?.() || (row.createdAt as any),
    }));
  }

  async createAccount(dto: CreateAffiliateAccountDto): Promise<AffiliateAccountDto> {
    const id = `acc-${Date.now()}`;
    await this.db.insert(schema.adAccounts).values({
      id,
      platform: dto.platform,
      accountName: dto.accountName,
      accountId: dto.accountId,
      status: 'active',
      balance: '0.00',
      dailySpend: '0.00',
      currency: dto.currency || 'USD',
      proxyIp: dto.proxyIp,
      personaId: dto.personaId,
      socialAccountId: dto.socialAccountId,
    });

    const accounts = await this.getAccounts();
    return accounts.find((a) => a.id === id)!;
  }
}
