import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { 
  PersonaDto, 
  CreatePersonaDto, 
  UpdatePersonaDto, 
  ActiveSocialSessionDto,
} from '@altlab/shared';
import { GeneratePersonaOptions } from './personas.types';
import { generateEstonianPersona } from './personas.generator';
import { DRIZZLE_CLIENT, DrizzleClient } from '../../database/database.provider';
import * as schema from '../../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class PersonasService {
  constructor(
    @Inject(DRIZZLE_CLIENT)
    private readonly db: DrizzleClient,
  ) {}

  private mapToPersonaDto(row: any): PersonaDto {
    return {
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      gender: row.gender,
      age: row.age,
      birthDate: row.birthDate,
      avatarUrl: row.avatarUrl || undefined,
      countryCode: row.countryCode,
      country: row.country,
      city: row.city,
      address: row.address,
      timezone: row.timezone,
      locale: row.locale,
      email: row.email,
      phone: row.phone,
      interests: row.interests || [],
      socialAccounts: (row.socialAccounts || []).map((s: any) => ({
        id: s.id,
        personaId: s.personaId,
        platform: s.platform,
        username: s.username,
        displayName: s.displayName,
        email: s.email || undefined,
        profileUrl: s.profileUrl || undefined,
        status: s.status,
        has2fa: Boolean(s.has2fa),
        twoFactorType: s.twoFactorType || 'none',
        twoFactorSecret: s.twoFactorSecret || undefined,
        loggedInProfileIds: s.loggedInProfileIds || [],
        youtubeChannels: s.youtubeChannels || undefined,
        adAccounts: (s.adAccounts || []).map((a: any) => ({
          id: a.id,
          platform: a.platform,
          accountName: a.accountName,
          accountId: a.accountId,
          status: a.status,
          balance: parseFloat(a.balance) || 0,
          dailySpend: parseFloat(a.dailySpend) || 0,
          currency: a.currency,
          proxyIp: a.proxyIp || undefined,
          personaId: a.personaId || undefined,
          socialAccountId: a.socialAccountId || undefined,
          createdAt: a.createdAt?.toISOString?.() || a.createdAt,
        })),
        createdAt: s.createdAt?.toISOString?.() || s.createdAt,
      })),
      linkedProfileIds: row.linkedProfileIds || [],
      createdAt: row.createdAt?.toISOString?.() || row.createdAt,
      updatedAt: row.updatedAt?.toISOString?.() || row.updatedAt,
    };
  }

  async getPersonas(): Promise<PersonaDto[]> {
    const rows = await this.db.query.personas.findMany({
      with: {
        socialAccounts: {
          with: {
            adAccounts: true,
          },
        },
      },
      orderBy: (personas, { desc }) => [desc(personas.createdAt)],
    });

    return rows.map((r) => this.mapToPersonaDto(r));
  }

  async getPersonaById(id: string): Promise<PersonaDto> {
    const row = await this.db.query.personas.findFirst({
      where: eq(schema.personas.id, id),
      with: {
        socialAccounts: {
          with: {
            adAccounts: true,
          },
        },
      },
    });

    if (!row) {
      throw new NotFoundException(`Persona with ID ${id} not found`);
    }

    return this.mapToPersonaDto(row);
  }

  async generatePersona(options?: GeneratePersonaOptions): Promise<PersonaDto> {
    const generated = generateEstonianPersona(options);

    // 1. Insert Persona
    await this.db.insert(schema.personas).values({
      id: generated.id,
      firstName: generated.firstName,
      lastName: generated.lastName,
      gender: generated.gender,
      age: generated.age,
      birthDate: generated.birthDate,
      avatarUrl: generated.avatarUrl,
      countryCode: generated.countryCode,
      country: generated.country,
      city: generated.city,
      address: generated.address,
      timezone: generated.timezone,
      locale: generated.locale,
      email: generated.email,
      phone: generated.phone,
      interests: generated.interests,
      linkedProfileIds: generated.linkedProfileIds || [],
    });

    // 2. Insert Social Accounts & attached Ad Accounts
    if (generated.socialAccounts && generated.socialAccounts.length > 0) {
      for (const s of generated.socialAccounts) {
        await this.db.insert(schema.socialAccounts).values({
          id: s.id,
          personaId: generated.id,
          platform: s.platform,
          username: s.username,
          displayName: s.displayName,
          email: s.email,
          profileUrl: s.profileUrl,
          status: s.status,
          has2fa: Boolean(s.has2fa),
          twoFactorType: s.twoFactorType || 'none',
          twoFactorSecret: s.twoFactorSecret || null,
          loggedInProfileIds: s.loggedInProfileIds || [],
          youtubeChannels: s.youtubeChannels || [],
        });

        if (s.adAccounts && s.adAccounts.length > 0) {
          for (const a of s.adAccounts) {
            await this.db.insert(schema.adAccounts).values({
              id: a.id,
              platform: a.platform,
              accountName: a.accountName,
              accountId: a.accountId,
              status: a.status,
              balance: String(a.balance || 0),
              dailySpend: String(a.dailySpend || 0),
              currency: a.currency || 'USD',
              proxyIp: a.proxyIp,
              personaId: generated.id,
              socialAccountId: s.id,
            });
          }
        }
      }
    }

    return this.getPersonaById(generated.id);
  }

  async createPersona(dto: CreatePersonaDto): Promise<PersonaDto> {
    const personaId = `per-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const avatarUrl = dto.gender === 'MALE'
      ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80';

    await this.db.insert(schema.personas).values({
      id: personaId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      gender: dto.gender,
      age: dto.age || 30,
      birthDate: dto.birthDate || '1996-01-01',
      avatarUrl: dto.avatarUrl || avatarUrl,
      countryCode: dto.countryCode || 'EE',
      country: dto.country || 'Estonia',
      city: dto.city || 'Tallinn',
      address: dto.address || 'Kesklinn, 10115 Tallinn',
      timezone: dto.timezone || 'Europe/Tallinn',
      locale: dto.locale || 'et-EE, et;q=0.9, en;q=0.8',
      email: dto.email || `${dto.firstName.toLowerCase()}.${dto.lastName.toLowerCase()}@mail.ee`,
      phone: dto.phone || `+372 5${Math.floor(Math.random() * 9000000 + 1000000)}`,
      interests: dto.interests || [
        { categoryCode: 'FINANCE', categoryName: 'Finance & Investing', weight: 60 },
        { categoryCode: 'TECH', categoryName: 'Technology & IT', weight: 40 },
      ],
      linkedProfileIds: [],
    });

    if (dto.socialAccounts && dto.socialAccounts.length > 0) {
      for (const s of dto.socialAccounts) {
        const socialId = `soc-${s.platform.slice(0, 4)}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
        await this.db.insert(schema.socialAccounts).values({
          id: socialId,
          personaId,
          platform: s.platform,
          username: s.username,
          displayName: s.displayName || `${dto.firstName} ${dto.lastName}`,
          email: s.email || dto.email,
          profileUrl: s.platform === 'facebook' ? `https://facebook.com/${s.username}` : undefined,
          status: s.status || 'farmed',
          has2fa: Boolean(s.has2fa),
          twoFactorType: s.twoFactorType || (s.has2fa ? 'totp' : 'none'),
          twoFactorSecret: s.twoFactorSecret || null,
          loggedInProfileIds: [],
        });
      }
    }

    return this.getPersonaById(personaId);
  }

  async updatePersona(id: string, dto: UpdatePersonaDto): Promise<PersonaDto> {
    const updateData: any = { updatedAt: new Date() };
    if (dto.firstName) updateData.firstName = dto.firstName;
    if (dto.lastName) updateData.lastName = dto.lastName;
    if (dto.gender) updateData.gender = dto.gender;
    if (dto.age) updateData.age = dto.age;
    if (dto.birthDate) updateData.birthDate = dto.birthDate;
    if (dto.countryCode) updateData.countryCode = dto.countryCode;
    if (dto.country) updateData.country = dto.country;
    if (dto.city) updateData.city = dto.city;
    if (dto.address) updateData.address = dto.address;
    if (dto.timezone) updateData.timezone = dto.timezone;
    if (dto.locale) updateData.locale = dto.locale;
    if (dto.email) updateData.email = dto.email;
    if (dto.phone) updateData.phone = dto.phone;
    if (dto.interests) updateData.interests = dto.interests;
    if (dto.linkedProfileIds) updateData.linkedProfileIds = dto.linkedProfileIds;

    await this.db.update(schema.personas).set(updateData).where(eq(schema.personas.id, id));
    return this.getPersonaById(id);
  }

  async deletePersona(id: string): Promise<boolean> {
    const result = await this.db.delete(schema.personas).where(eq(schema.personas.id, id));
    return Boolean(result);
  }

  /**
   * M:N Session toggle: Adds or removes a browser profile device from a social account's active logged-in profiles.
   */
  async toggleSocialSession(
    personaId: string, 
    socialAccountId: string, 
    profileId: string, 
    action: 'login' | 'logout' | 'toggle' = 'toggle'
  ): Promise<{ success: boolean; loggedIn: boolean }> {
    const persona = await this.getPersonaById(personaId);
    const social = persona.socialAccounts.find((s) => s.id === socialAccountId);
    if (!social) {
      throw new NotFoundException(`Social account ${socialAccountId} not found on persona ${personaId}`);
    }

    const currentlyLoggedIn = (social.loggedInProfileIds || []).includes(profileId);
    let shouldBeLoggedIn = !currentlyLoggedIn;
    if (action === 'login') shouldBeLoggedIn = true;
    if (action === 'logout') shouldBeLoggedIn = false;

    let updatedProfileIds: string[] = [...(social.loggedInProfileIds || [])];
    let updatedPersonaProfileIds: string[] = [...(persona.linkedProfileIds || [])];

    if (shouldBeLoggedIn && !currentlyLoggedIn) {
      updatedProfileIds.push(profileId);
      if (!updatedPersonaProfileIds.includes(profileId)) {
        updatedPersonaProfileIds.push(profileId);
      }
    } else if (!shouldBeLoggedIn && currentlyLoggedIn) {
      updatedProfileIds = updatedProfileIds.filter((id) => id !== profileId);
    }

    // Persist changes
    await this.db
      .update(schema.socialAccounts)
      .set({ loggedInProfileIds: updatedProfileIds, updatedAt: new Date() })
      .where(eq(schema.socialAccounts.id, socialAccountId));

    if (shouldBeLoggedIn && !currentlyLoggedIn) {
      await this.db
        .update(schema.personas)
        .set({ linkedProfileIds: updatedPersonaProfileIds, updatedAt: new Date() })
        .where(eq(schema.personas.id, personaId));
    }

    return { success: true, loggedIn: shouldBeLoggedIn };
  }

  /**
   * Links a browser profile device to a persona.
   */
  async assignProfileToPersona(personaId: string, profileId: string): Promise<boolean> {
    await this.unassignProfile(profileId);

    const persona = await this.getPersonaById(personaId);
    const updatedIds = Array.from(new Set([...persona.linkedProfileIds, profileId]));
    await this.db
      .update(schema.personas)
      .set({ linkedProfileIds: updatedIds, updatedAt: new Date() })
      .where(eq(schema.personas.id, personaId));

    return true;
  }

  /**
   * Unlinks a browser profile device from all personas and social sessions.
   */
  async unassignProfile(profileId: string): Promise<boolean> {
    const allPersonas = await this.getPersonas();
    for (const p of allPersonas) {
      if (p.linkedProfileIds.includes(profileId)) {
        const remaining = p.linkedProfileIds.filter((id) => id !== profileId);
        await this.db
          .update(schema.personas)
          .set({ linkedProfileIds: remaining, updatedAt: new Date() })
          .where(eq(schema.personas.id, p.id));
      }

      for (const s of p.socialAccounts) {
        if ((s.loggedInProfileIds || []).includes(profileId)) {
          const remainingIds = s.loggedInProfileIds.filter((id) => id !== profileId);
          await this.db
            .update(schema.socialAccounts)
            .set({ loggedInProfileIds: remainingIds, updatedAt: new Date() })
            .where(eq(schema.socialAccounts.id, s.id));
        }
      }
    }
    return true;
  }

  async getPersonaByProfileId(profileId: string): Promise<PersonaDto | undefined> {
    const all = await this.getPersonas();
    return all.find((p) => p.linkedProfileIds.includes(profileId));
  }

  async getActiveSessionsForProfile(profileId: string): Promise<ActiveSocialSessionDto[]> {
    const all = await this.getPersonas();
    const sessions: ActiveSocialSessionDto[] = [];
    for (const p of all) {
      for (const s of p.socialAccounts) {
        if ((s.loggedInProfileIds || []).includes(profileId)) {
          sessions.push({
            socialAccountId: s.id,
            platform: s.platform,
            username: s.username,
            displayName: s.displayName,
            personaId: p.id,
            personaName: `${p.firstName} ${p.lastName}`,
          });
        }
      }
    }
    return sessions;
  }
}
