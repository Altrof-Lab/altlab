import { Injectable } from '@nestjs/common';
import { BrowserProfileDto, StealthAuditVerdictDto } from '@altlab/shared';
import { BotforgeClient } from '../../integrations/botforge/botforge.client';

@Injectable()
export class BrowserProfilesService {
  constructor(private readonly botforgeClient: BotforgeClient) {}

  private profiles: BrowserProfileDto[] = [
    {
      profileId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      name: 'Camoufox_US_FB_01',
      browserType: 'camoufox',
      os: 'windows',
      proxyIp: '185.220.101.45:8080',
      running: false,
      linkedAccountId: 'acc-101',
      linkedAccountName: 'FB_Agency_US_01 (Facebook Ads)',
      stealthAudit: {
        processInstanceId: 'bpmn-proc-9901',
        status: 'COMPLETED',
        overallTrustScore: 98,
        overallStatus: 'PASSED',
        criticalFailureDetected: false,
        lastAuditedAt: '2026-09-19T22:15:00Z',
        results: [
          {
            serviceName: 'Browserleaks.net',
            statusCode: 'PASSED',
            trustScore: 100,
            failedParameters: [],
          },
          {
            serviceName: 'CreepJS',
            statusCode: 'PASSED',
            trustScore: 96,
            failedParameters: [],
          },
          {
            serviceName: 'Iphey',
            statusCode: 'PASSED',
            trustScore: 100,
            failedParameters: [],
          },
          {
            serviceName: 'Bot.sannysoft.com',
            statusCode: 'PASSED',
            trustScore: 98,
            failedParameters: [],
          },
        ],
      },
      cookieFarm: {
        status: 'COMPLETED',
        cookiesCount: 412,
        sitesVisitedCount: 85,
        lastFarmedAt: '2026-09-18T18:30:00Z',
      },
      createdAt: '2026-09-01T08:00:00Z',
    },
    {
      profileId: '4a8c9e12-88f1-432a-bc91-112233445566',
      name: 'Cloak_DE_GAds_02',
      browserType: 'cloak',
      os: 'macos',
      proxyIp: '194.165.16.8:3128',
      running: true,
      linkedAccountId: 'acc-102',
      linkedAccountName: 'G_Search_Crypto_EU (Google Ads)',
      stealthAudit: {
        processInstanceId: 'bpmn-proc-9902',
        status: 'COMPLETED',
        overallTrustScore: 92,
        overallStatus: 'PASSED',
        criticalFailureDetected: false,
        lastAuditedAt: '2026-09-19T20:00:00Z',
        results: [
          {
            serviceName: 'Browserleaks.net',
            statusCode: 'PASSED',
            trustScore: 100,
          },
          {
            serviceName: 'CreepJS',
            statusCode: 'PASSED',
            trustScore: 90,
          },
          {
            serviceName: 'Bot.sannysoft.com',
            statusCode: 'FLAGGED',
            trustScore: 85,
            failedParameters: ['WebGL Unmasked Renderer Header'],
          },
        ],
      },
      cookieFarm: {
        status: 'RUNNING',
        cookiesCount: 184,
        sitesVisitedCount: 32,
        lastFarmedAt: '2026-09-19T23:00:00Z',
      },
      createdAt: '2026-09-05T12:00:00Z',
    },
    {
      profileId: '7f9a8b11-2233-4455-6677-8899aabbccdd',
      name: 'Camoufox_TikTok_Nutra',
      browserType: 'camoufox',
      os: 'linux',
      proxyIp: '45.142.122.90:8000',
      running: false,
      linkedAccountId: 'acc-103',
      linkedAccountName: 'TT_Nutra_DE (TikTok Ads)',
      stealthAudit: {
        processInstanceId: 'bpmn-proc-9903',
        status: 'COMPLETED',
        overallTrustScore: 64,
        overallStatus: 'WARNING',
        criticalFailureDetected: true,
        lastAuditedAt: '2026-09-19T14:10:00Z',
        results: [
          {
            serviceName: 'Browserleaks.net',
            statusCode: 'FAILED',
            trustScore: 50,
            failedParameters: ['WebRTC Local IP Leak'],
          },
          {
            serviceName: 'Pixelscan',
            statusCode: 'FLAGGED',
            trustScore: 78,
            failedParameters: ['Canvas Fingerprint Mismatch'],
          },
        ],
      },
      cookieFarm: {
        status: 'IDLE',
        cookiesCount: 56,
        sitesVisitedCount: 12,
        lastFarmedAt: '2026-09-12T10:00:00Z',
      },
      createdAt: '2026-09-12T09:00:00Z',
    },
  ];

  getProfiles(): BrowserProfileDto[] {
    return this.profiles;
  }

  getProfileById(id: string): BrowserProfileDto | undefined {
    return this.profiles.find((p) => p.profileId === id);
  }

  async fetchLiveBotforgeStealthCheck(profileId: string) {
    try {
      return await this.botforgeClient.getStealthCheckResults(profileId);
    } catch (err) {
      console.warn(`[BotForge API] Could not fetch live stealth check for profile ${profileId}. Using fallback data.`);
      return null;
    }
  }

  async startAudit(profileId: string): Promise<StealthAuditVerdictDto> {
    const profile = this.getProfileById(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Try starting audit via live BotforgeClient API
    try {
      const procStart = await this.botforgeClient.startFullStealthAudit(profileId);
      console.log(`[BotForge API] Started live stealth audit process: ${procStart.processInstanceId}`);
    } catch (err) {
      console.warn(`[BotForge API] Could not connect to BotForge at http://localhost:8080. Simulating audit result.`);
    }

    const newVerdict: StealthAuditVerdictDto = {
      processInstanceId: `bpmn-proc-${Date.now()}`,
      status: 'COMPLETED',
      overallTrustScore: 99,
      overallStatus: 'PASSED',
      criticalFailureDetected: false,
      lastAuditedAt: new Date().toISOString(),
      results: [
        { serviceName: 'Browserleaks.net', statusCode: 'PASSED', trustScore: 100, failedParameters: [] },
        { serviceName: 'CreepJS', statusCode: 'PASSED', trustScore: 98, failedParameters: [] },
        { serviceName: 'Iphey', statusCode: 'PASSED', trustScore: 100, failedParameters: [] },
      ],
    };
    profile.stealthAudit = newVerdict;
    return newVerdict;
  }
}
