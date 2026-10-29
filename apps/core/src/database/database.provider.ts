import { Provider, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export const DRIZZLE_CLIENT = 'DRIZZLE_CLIENT';
export type DrizzleClient = NodePgDatabase<typeof schema>;

const logger = new Logger('DatabaseProvider');

export const databaseProviders: Provider[] = [
  {
    provide: DRIZZLE_CLIENT,
    useFactory: async (): Promise<DrizzleClient> => {
      const connectionString = process.env.DATABASE_URL || 'postgresql://altlab:altlab@localhost:5438/altlab';
      logger.log(`Connecting to PostgreSQL via Drizzle ORM: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);

      const pool = new Pool({
        connectionString,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      const db = drizzle(pool, { schema });

      // Run automatic seeding if personas table is empty
      try {
        const existingPersonas = await db.select({ id: schema.personas.id }).from(schema.personas).limit(1);
        if (existingPersonas.length === 0) {
          logger.log('Database tables are empty. Running initial seed data...');
          await seedInitialData(db);
          logger.log('Initial seed data inserted successfully.');
        }
      } catch (err: any) {
        logger.warn(`Could not verify/seed initial database records (tables might need migration): ${err.message}`);
      }

      return db;
    },
  },
];

async function seedInitialData(db: DrizzleClient) {
  // 1. Seed Personas
  await db.insert(schema.personas).values([
    {
      id: 'per-jaan-tamm',
      firstName: 'Jaan',
      lastName: 'Tamm',
      gender: 'MALE',
      age: 32,
      birthDate: '1994-06-12',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      countryCode: 'EE',
      country: 'Estonia',
      city: 'Tallinn',
      address: 'Tartu mnt 18-12, 10145 Tallinn',
      timezone: 'Europe/Tallinn',
      locale: 'et-EE, et;q=0.9, en;q=0.8',
      email: 'jaan.tamm1994@gmail.com',
      phone: '+372 555 12847',
      interests: [
        { categoryCode: 'FINANCE', categoryName: 'Finance & Investing', weight: 55 },
        { categoryCode: 'TECH', categoryName: 'Technology & IT', weight: 30 },
        { categoryCode: 'NEWS', categoryName: 'News & Media', weight: 15 },
      ],
      linkedProfileIds: ['581e57cb-1b15-4a19-9474-0bd27c49567a'],
    },
    {
      id: 'per-laura-saar',
      firstName: 'Laura',
      lastName: 'Saar',
      gender: 'FEMALE',
      age: 28,
      birthDate: '1998-03-24',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      countryCode: 'EE',
      country: 'Estonia',
      city: 'Tartu',
      address: 'Riia mnt 42-6, 51010 Tartu',
      timezone: 'Europe/Tallinn',
      locale: 'et-EE, et;q=0.9, en;q=0.8',
      email: 'laura.saar98@mail.ee',
      phone: '+372 581 99420',
      interests: [
        { categoryCode: 'E_COMMERCE', categoryName: 'Online Shopping', weight: 45 },
        { categoryCode: 'FASHION', categoryName: 'Fashion & Beauty', weight: 35 },
        { categoryCode: 'TRAVEL', categoryName: 'Travel & Tourism', weight: 20 },
      ],
      linkedProfileIds: ['129eff7b-7cce-463e-b058-09c29108c06a'],
    },
    {
      id: 'per-mart-kallas',
      firstName: 'Mart',
      lastName: 'Kallas',
      gender: 'MALE',
      age: 39,
      birthDate: '1987-11-05',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      countryCode: 'EE',
      country: 'Estonia',
      city: 'Pärnu',
      address: 'Rüütli tn 15-3, 80010 Pärnu',
      timezone: 'Europe/Tallinn',
      locale: 'et-EE, et;q=0.9, en;q=0.8',
      email: 'mart.kallas.biz@gmail.com',
      phone: '+372 562 33190',
      interests: [
        { categoryCode: 'BUSINESS', categoryName: 'Business & Entrepreneurship', weight: 40 },
        { categoryCode: 'REAL_ESTATE', categoryName: 'Real Estate', weight: 35 },
        { categoryCode: 'FINANCE', categoryName: 'Finance & Investing', weight: 25 },
      ],
      linkedProfileIds: [],
    },
  ]);

  // 2. Seed Social Accounts
  await db.insert(schema.socialAccounts).values([
    {
      id: 'soc-fb-jaan',
      personaId: 'per-jaan-tamm',
      platform: 'facebook',
      username: 'jaan.tamm.ee',
      displayName: 'Jaan Tamm',
      email: 'jaan.tamm1994@gmail.com',
      profileUrl: 'https://facebook.com/jaan.tamm.ee',
      status: 'farmed',
      has2fa: true,
      twoFactorType: 'totp',
      twoFactorSecret: 'JBSWY3DPEHPK3PXP',
      loggedInProfileIds: ['581e57cb-1b15-4a19-9474-0bd27c49567a'],
    },
    {
      id: 'soc-goog-jaan',
      personaId: 'per-jaan-tamm',
      platform: 'google',
      username: 'jaan.tamm',
      displayName: 'Jaan Tamm',
      email: 'jaan.tamm1994@gmail.com',
      profileUrl: 'https://myaccount.google.com/',
      status: 'active',
      has2fa: true,
      twoFactorType: 'totp',
      twoFactorSecret: 'HXDMVJECJJWSRB3H',
      loggedInProfileIds: ['581e57cb-1b15-4a19-9474-0bd27c49567a'],
      youtubeChannels: [
        {
          id: 'yt-jaan-tech',
          name: 'Jaan Tamm Tech & Crypto',
          channelUrl: 'https://youtube.com/@jaantamm_tech',
          subscribersCount: 1420,
        },
      ],
    },
    {
      id: 'soc-goog-laura',
      personaId: 'per-laura-saar',
      platform: 'google',
      username: 'laura.saar',
      displayName: 'Laura Saar',
      email: 'laura.saar98@mail.ee',
      profileUrl: 'https://myaccount.google.com/',
      status: 'active',
      has2fa: true,
      twoFactorType: 'totp',
      twoFactorSecret: 'GEZDGNBVGY3TQOJQ',
      loggedInProfileIds: ['129eff7b-7cce-463e-b058-09c29108c06a'],
      youtubeChannels: [
        {
          id: 'yt-laura-style',
          name: 'Laura Nordic Lifestyle',
          channelUrl: 'https://youtube.com/@laurasaar',
          subscribersCount: 2890,
        },
      ],
    },
    {
      id: 'soc-fb-laura',
      personaId: 'per-laura-saar',
      platform: 'facebook',
      username: 'laura.saar.ee',
      displayName: 'Laura Saar',
      email: 'laura.saar98@mail.ee',
      profileUrl: 'https://facebook.com/laura.saar.ee',
      status: 'farmed',
      loggedInProfileIds: [],
    },
    {
      id: 'soc-fb-mart',
      personaId: 'per-mart-kallas',
      platform: 'facebook',
      username: 'mart.kallas.official',
      displayName: 'Mart Kallas',
      email: 'mart.kallas.biz@gmail.com',
      profileUrl: 'https://facebook.com/mart.kallas.official',
      status: 'active',
      loggedInProfileIds: [],
    },
  ]);

  // 3. Seed Ad Accounts
  await db.insert(schema.adAccounts).values([
    {
      id: 'acc-101',
      platform: 'Facebook Ads',
      accountName: 'FB_Agency_US_01',
      accountId: 'act_48291048102',
      status: 'active',
      balance: '4500.00',
      dailySpend: '1250.50',
      currency: 'USD',
      proxyIp: '185.220.101.45:8080',
      personaId: 'per-jaan-tamm',
      socialAccountId: 'soc-fb-jaan',
    },
    {
      id: 'acc-102',
      platform: 'Google Ads',
      accountName: 'G_Search_Crypto_EU',
      accountId: '918-204-1182',
      status: 'active',
      balance: '12800.00',
      dailySpend: '3400.00',
      currency: 'USD',
      proxyIp: '194.165.16.8:3128',
      personaId: 'per-laura-saar',
      socialAccountId: 'soc-goog-laura',
    },
    {
      id: 'acc-103',
      platform: 'TikTok Ads',
      accountName: 'TT_Nutra_DE',
      accountId: 'tt_adv_7829104',
      status: 'in_review',
      balance: '1200.00',
      dailySpend: '450.00',
      currency: 'EUR',
      proxyIp: '45.142.122.90:8000',
      personaId: 'per-mart-kallas',
      socialAccountId: 'soc-fb-mart',
    },
    {
      id: 'acc-104',
      platform: 'Taboola',
      accountName: 'Taboola_Native_WW',
      accountId: 'tab_902184',
      status: 'paused',
      balance: '3100.00',
      dailySpend: '0.00',
      currency: 'USD',
      proxyIp: '185.220.101.45:8080',
      personaId: 'per-jaan-tamm',
      socialAccountId: 'soc-fb-jaan',
    },
  ]);
}
