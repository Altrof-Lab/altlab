import { pgTable, varchar, integer, text, jsonb, timestamp, numeric, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { 
  PersonaInterestAffinityDto, 
  YouTubeChannelDto, 
  SocialPlatform, 
  SocialAccountStatus, 
  LoggedInBrowserDto,
  TwoFactorType,
  AffiliatePlatform, 
  AccountStatus 
} from '@altlab/shared';

// 1. Personas Table
export const personas = pgTable('personas', {
  id: varchar('id', { length: 64 }).primaryKey(),
  firstName: varchar('first_name', { length: 128 }).notNull(),
  lastName: varchar('last_name', { length: 128 }).notNull(),
  gender: varchar('gender', { length: 16 }).$type<'MALE' | 'FEMALE'>().notNull(),
  age: integer('age').notNull(),
  birthDate: varchar('birth_date', { length: 32 }).notNull(),
  avatarUrl: text('avatar_url'),

  // Geo (Estonian Default)
  countryCode: varchar('country_code', { length: 8 }).default('EE').notNull(),
  country: varchar('country', { length: 64 }).default('Estonia').notNull(),
  city: varchar('city', { length: 64 }).default('Tallinn').notNull(),
  address: text('address').notNull(),
  timezone: varchar('timezone', { length: 64 }).default('Europe/Tallinn').notNull(),
  locale: varchar('locale', { length: 64 }).default('et-EE, et;q=0.9, en;q=0.8').notNull(),

  // Contacts
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 64 }).notNull(),

  // Behavioral Affinities & Device links
  interests: jsonb('interests').$type<PersonaInterestAffinityDto[]>().notNull(),
  linkedProfileIds: jsonb('linked_profile_ids').$type<string[]>().default([]).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Social Accounts Table
export const socialAccounts = pgTable('social_accounts', {
  id: varchar('id', { length: 64 }).primaryKey(),
  personaId: varchar('persona_id', { length: 64 })
    .notNull()
    .references(() => personas.id, { onDelete: 'cascade' }),
  platform: varchar('platform', { length: 32 }).$type<SocialPlatform>().notNull(),
  username: varchar('username', { length: 128 }).notNull(),
  displayName: varchar('display_name', { length: 128 }).notNull(),
  email: varchar('email', { length: 255 }),
  profileUrl: text('profile_url'),
  status: varchar('status', { length: 32 }).$type<SocialAccountStatus>().default('farmed').notNull(),
  has2fa: boolean('has_2fa').default(false).notNull(),
  twoFactorType: varchar('two_factor_type', { length: 32 }).$type<TwoFactorType>().default('none').notNull(),
  twoFactorSecret: varchar('two_factor_secret', { length: 128 }),
  loggedInProfileIds: jsonb('logged_in_profile_ids').$type<string[]>().default([]).notNull(),
  youtubeChannels: jsonb('youtube_channels').$type<YouTubeChannelDto[]>(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Ad Accounts Table
export const adAccounts = pgTable('ad_accounts', {
  id: varchar('id', { length: 64 }).primaryKey(),
  platform: varchar('platform', { length: 64 }).$type<AffiliatePlatform>().notNull(),
  accountName: varchar('account_name', { length: 128 }).notNull(),
  accountId: varchar('account_id', { length: 128 }).notNull(),
  status: varchar('status', { length: 32 }).$type<AccountStatus>().default('active').notNull(),
  balance: numeric('balance', { precision: 12, scale: 2 }).default('0').notNull(),
  dailySpend: numeric('daily_spend', { precision: 12, scale: 2 }).default('0').notNull(),
  currency: varchar('currency', { length: 16 }).default('USD').notNull(),
  proxyIp: varchar('proxy_ip', { length: 128 }),

  // Foreign keys
  personaId: varchar('persona_id', { length: 64 }).references(() => personas.id, { onDelete: 'set null' }),
  socialAccountId: varchar('social_account_id', { length: 64 }).references(() => socialAccounts.id, { onDelete: 'set null' }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 4. Entity Relations
export const personasRelations = relations(personas, ({ many }) => ({
  socialAccounts: many(socialAccounts),
  adAccounts: many(adAccounts),
}));

export const socialAccountsRelations = relations(socialAccounts, ({ one, many }) => ({
  persona: one(personas, {
    fields: [socialAccounts.personaId],
    references: [personas.id],
  }),
  adAccounts: many(adAccounts),
}));

export const adAccountsRelations = relations(adAccounts, ({ one }) => ({
  persona: one(personas, {
    fields: [adAccounts.personaId],
    references: [personas.id],
  }),
  socialAccount: one(socialAccounts, {
    fields: [adAccounts.socialAccountId],
    references: [socialAccounts.id],
  }),
}));

export type PersonaEntity = typeof personas.$inferSelect;
export type InsertPersonaEntity = typeof personas.$inferInsert;

export type SocialAccountEntity = typeof socialAccounts.$inferSelect;
export type InsertSocialAccountEntity = typeof socialAccounts.$inferInsert;

export type AdAccountEntity = typeof adAccounts.$inferSelect;
export type InsertAdAccountEntity = typeof adAccounts.$inferInsert;
