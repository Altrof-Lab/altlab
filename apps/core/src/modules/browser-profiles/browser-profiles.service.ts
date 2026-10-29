import { Injectable } from '@nestjs/common';
import { BrowserProfileDto, StealthAuditVerdictDto, StealthServiceResult, SpyhubNodeStatusDto, SpyhubNodeConfigDto, SingleNodeDataDto } from '@altlab/shared';
import { BotforgeClient } from '../../integrations/botforge/botforge.client';
import { SpyhubClient } from '../../integrations/spyhub/spyhub.client';
import { PersonasService } from '../personas/personas.service';

@Injectable()
export class BrowserProfilesService {
  constructor(
    private readonly botforgeClient: BotforgeClient,
    private readonly spyhubClient: SpyhubClient,
    private readonly personasService: PersonasService,
  ) {}

  private async enrichWithPersona(profile: BrowserProfileDto): Promise<BrowserProfileDto> {
    const persona = await this.personasService.getPersonaByProfileId(profile.profileId);
    if (persona) {
      profile.personaId = persona.id;
      profile.personaName = `${persona.firstName} ${persona.lastName}`;
    }
    profile.activeSocialSessions = await this.personasService.getActiveSessionsForProfile(profile.profileId);
    return profile;
  }

  private fallbackProfiles: BrowserProfileDto[] = [
    {
      profileId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
      name: 'Camoufox_US_FB_01',
      browserType: 'camoufox',
      os: 'windows',
      proxyIp: '185.220.101.45:8080',
      running: false,
      nodeUrl: 'http://192.168.1.120:8000',
      nodeName: 'Windows Node (192.168.1.120:8000)',
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
          { serviceName: 'Browserleaks.net', statusCode: 'PASSED', trustScore: 100, failedParameters: [] },
          { serviceName: 'CreepJS', statusCode: 'PASSED', trustScore: 96, failedParameters: [] },
          { serviceName: 'Iphey', statusCode: 'PASSED', trustScore: 100, failedParameters: [] },
          { serviceName: 'Bot.sannysoft.com', statusCode: 'PASSED', trustScore: 98, failedParameters: [] },
        ],
      },
      cookieFarm: {
        status: 'COMPLETED',
        cookiesCount: 412,
        sitesVisitedCount: 85,
        lastFarmedAt: '2026-09-18T18:30:00Z',
        consentSuccessRate: 100,
        totalDurationSeconds: 84,
        recentVisits: [
          {
            siteUrl: 'swedbank.ee',
            siteName: 'Swedbank Eesti',
            category: 'finance',
            cookieBannerText: 'Nõustun kõigi küpsistega',
            dismissalLevel: 'Level 1 (Text)',
            cookiesCaptured: 16,
            durationSeconds: 5.4,
            interactionSummary: 'Scroll (1200px) • 2 Pageviews',
            status: 'COMPLETED',
            visitedAt: '2026-09-18T18:29:45Z',
          },
          {
            siteUrl: 'kaup24.ee',
            siteName: 'Kaup24 E-Kaubandus',
            category: 'ecommerce',
            cookieBannerText: 'Luba kõik',
            dismissalLevel: 'Level 1 (Text)',
            cookiesCaptured: 24,
            durationSeconds: 8.2,
            interactionSummary: 'Product Catalog Browsing • 3 Items',
            status: 'COMPLETED',
            visitedAt: '2026-09-18T18:29:12Z',
          },
          {
            siteUrl: 'telia.ee',
            siteName: 'Telia Eesti',
            category: 'telecom',
            cookieBannerText: 'Nõustun kõigi küpsistega',
            dismissalLevel: 'Level 1 (Text)',
            cookiesCaptured: 18,
            durationSeconds: 6.1,
            interactionSummary: 'Homepage Viewport Warm • 4s dwell',
            status: 'COMPLETED',
            visitedAt: '2026-09-18T18:28:40Z',
          },
          {
            siteUrl: 'if.ee',
            siteName: 'If Kindlustus',
            category: 'insurance',
            cookieBannerText: 'I accept all',
            dismissalLevel: 'Level 1 (Text)',
            cookiesCaptured: 11,
            durationSeconds: 4.8,
            interactionSummary: 'Policy Calculator Dwell • Scroll 600px',
            status: 'COMPLETED',
            visitedAt: '2026-09-18T18:28:10Z',
          },
          {
            siteUrl: 'booking.com',
            siteName: 'Booking.com Travel',
            category: 'travel',
            cookieBannerText: 'Accept',
            dismissalLevel: 'Level 2 (Selector)',
            cookiesCaptured: 32,
            durationSeconds: 9.5,
            interactionSummary: 'Tallinn Hotel Search Warm • Scroll & Click',
            status: 'COMPLETED',
            visitedAt: '2026-09-18T18:27:30Z',
          },
          {
            siteUrl: 'euronics.ee',
            siteName: 'Euronics Elektroonika',
            category: 'ecommerce',
            cookieBannerText: 'Nõustun',
            dismissalLevel: 'Level 1 (Text)',
            cookiesCaptured: 19,
            durationSeconds: 5.7,
            interactionSummary: 'Category Filter Warm • 2 Clicks',
            status: 'COMPLETED',
            visitedAt: '2026-09-18T18:26:50Z',
          },
          {
            siteUrl: 'lhv.ee',
            siteName: 'LHV Pank',
            category: 'finance',
            cookieBannerText: 'Luban kõik küpsised',
            dismissalLevel: 'Level 1 (Text)',
            cookiesCaptured: 14,
            durationSeconds: 4.2,
            interactionSummary: 'Banking Portal Warm • 1 Pageview',
            status: 'COMPLETED',
            visitedAt: '2026-09-18T18:26:15Z',
          },
          {
            siteUrl: 'tripadvisor.com',
            siteName: 'Tripadvisor Reviews',
            category: 'travel',
            cookieBannerText: 'I Accept',
            dismissalLevel: 'Level 2 (Selector)',
            cookiesCaptured: 28,
            durationSeconds: 7.6,
            interactionSummary: 'Local Attractions View • Scroll 1800px',
            status: 'COMPLETED',
            visitedAt: '2026-09-18T18:25:35Z',
          },
        ],
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
      nodeUrl: 'http://localhost:8000',
      nodeName: 'macOS Node (Local)',
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
          { serviceName: 'Browserleaks.net', statusCode: 'PASSED', trustScore: 100 },
          { serviceName: 'CreepJS', statusCode: 'PASSED', trustScore: 90 },
          { serviceName: 'Bot.sannysoft.com', statusCode: 'FLAGGED', trustScore: 85, failedParameters: ['WebGL Unmasked Renderer Header'] },
        ],
      },
      cookieFarm: {
        status: 'RUNNING',
        cookiesCount: 184,
        sitesVisitedCount: 32,
        lastFarmedAt: '2026-09-19T23:00:00Z',
        consentSuccessRate: 100,
        totalDurationSeconds: 45,
        recentVisits: [
          {
            siteUrl: 'seb.ee',
            siteName: 'SEB Pank',
            category: 'finance',
            cookieBannerText: 'Nõustun',
            dismissalLevel: 'Level 1 (Text)',
            cookiesCaptured: 15,
            durationSeconds: 5.1,
            interactionSummary: 'Homepage Dwell • Scroll 1100px',
            status: 'COMPLETED',
            visitedAt: '2026-09-19T22:59:10Z',
          },
          {
            siteUrl: '1a.ee',
            siteName: '1a.ee Tehnika',
            category: 'ecommerce',
            cookieBannerText: 'Nõustun kõigiga',
            dismissalLevel: 'Level 1 (Text)',
            cookiesCaptured: 22,
            durationSeconds: 7.0,
            interactionSummary: 'Search Electronics Warm',
            status: 'COMPLETED',
            visitedAt: '2026-09-19T22:58:30Z',
          },
          {
            siteUrl: 'elisa.ee',
            siteName: 'Elisa Eesti',
            category: 'telecom',
            cookieBannerText: 'Luban kõik',
            dismissalLevel: 'Level 1 (Text)',
            cookiesCaptured: 12,
            durationSeconds: 3.9,
            interactionSummary: 'Telecommunications Portal',
            status: 'IN_PROGRESS',
            visitedAt: '2026-09-19T22:58:00Z',
          },
        ],
      },
      createdAt: '2026-09-05T12:00:00Z',
    },
  ];

  /**
   * Returns metadata for all configured SpyHub host nodes immediately (0ms wait).
   */
  getNodeConfigs(): SpyhubNodeConfigDto[] {
    return this.spyhubClient.getNodeUrls().map((url) => {
      const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
      return {
        nodeUrl: url,
        nodeName: isLocal ? 'SpyHub macOS (Local)' : `SpyHub Windows (${url.replace(/^https?:\/\//, '')})`,
        os: isLocal ? 'macos' : 'windows',
      };
    });
  }

  /**
   * Fetches status and profiles for a single specific SpyHub node URL.
   * Merges bulk summary metrics (trust scores, cookie count) from BotForge in 1 batch HTTP call.
   */
  async getNodeData(nodeUrl: string): Promise<SingleNodeDataDto> {
    const res = await this.spyhubClient.getNodeData(nodeUrl);

    // 1. Collect all profile IDs from SpyHub
    const profileIds = res.profiles.map(p => p.id);

    // 2. Make 1 single bulk summary call to BotForge
    const summaries = await this.botforgeClient.getProfilesSummaryInfo(profileIds);
    const summaryMap = new Map(summaries.map(s => [s.profileId, s]));

    // 3. Map SpyHub profiles with BotForge summary metrics
    const profiles = res.profiles.map((p): BrowserProfileDto => {
      const proxyIp = p.proxy?.host ? `${p.proxy.host}:${p.proxy.port || 8080}` : undefined;
      const existing = this.fallbackProfiles.find((f) => f.profileId === p.id);
      const summary = summaryMap.get(p.id);

      return {
        profileId: p.id,
        name: p.name,
        browserType: p.browser || 'camoufox',
        os: p.os || 'windows',
        proxyIp: proxyIp || existing?.proxyIp,
        running: p.isRunning || p.is_running || false,
        nodeUrl: p.nodeUrl,
        nodeName: p.nodeName,
        linkedAccountId: existing?.linkedAccountId,
        linkedAccountName: existing?.linkedAccountName,
        stealthAudit: (summary && summary.overallStatus !== 'NOT_AUDITED') ? {
          processInstanceId: existing?.stealthAudit?.processInstanceId || `bpmn-proc-${p.id.substring(0, 8)}`,
          status: 'COMPLETED',
          overallTrustScore: summary.overallTrustScore,
          overallStatus: summary.overallStatus as any,
          criticalFailureDetected: summary.overallStatus === 'FAILED',
          lastAuditedAt: existing?.stealthAudit?.lastAuditedAt || new Date().toISOString(),
          results: existing?.stealthAudit?.results || [],
        } : (existing?.stealthAudit?.results?.length ? existing.stealthAudit : undefined),
        cookieFarm: summary ? {
          status: existing?.cookieFarm?.status || 'COMPLETED',
          cookiesCount: summary.cookiesCount,
          sitesVisitedCount: summary.sitesVisitedCount,
          lastFarmedAt: existing?.cookieFarm?.lastFarmedAt || new Date().toISOString(),
          recentVisits: existing?.cookieFarm?.recentVisits,
          consentSuccessRate: existing?.cookieFarm?.consentSuccessRate || 100,
          totalDurationSeconds: existing?.cookieFarm?.totalDurationSeconds || 84,
        } : existing?.cookieFarm,
        createdAt: p.createdAt || new Date().toISOString(),
      };
    });

    return {
      nodeStatus: res.status,
      profiles: await Promise.all(profiles.map((p) => this.enrichWithPersona(p))),
    };
  }

  /**
   * Returns live node health statuses for all configured SpyHub nodes (macOS / Windows).
   */
  async getNodeStatuses(): Promise<SpyhubNodeStatusDto[]> {
    try {
      return await this.spyhubClient.getNodeStatuses();
    } catch (err) {
      return [
        { nodeUrl: 'http://localhost:8000', nodeName: 'SpyHub macOS (Local)', os: 'macos', status: 'online', responseTimeMs: 4, profileCount: 1 },
        { nodeUrl: 'http://192.168.1.120:8000', nodeName: 'SpyHub Windows (192.168.1.120)', os: 'windows', status: 'offline', profileCount: 0 },
      ];
    }
  }

  /**
   * Fetches and aggregates profiles across all configured SpyHub nodes (macOS + Windows).
   */
  async getProfiles(): Promise<BrowserProfileDto[]> {
    try {
      const liveSpyhubProfiles = await this.spyhubClient.getAllProfiles();

      if (liveSpyhubProfiles.length > 0) {
        const profileIds = liveSpyhubProfiles.map((p) => p.id);
        const summaries = await this.botforgeClient.getProfilesSummaryInfo(profileIds);
        const summaryMap = new Map(summaries.map((s) => [s.profileId, s]));

        return Promise.all(
          liveSpyhubProfiles.map(async (p): Promise<BrowserProfileDto> => {
            const proxyIp = p.proxy?.host ? `${p.proxy.host}:${p.proxy.port || 8080}` : undefined;
            const existing = this.fallbackProfiles.find((f) => f.profileId === p.id);
            const summary = summaryMap.get(p.id);

            return this.enrichWithPersona({
              profileId: p.id,
              name: p.name,
              browserType: p.browser || 'camoufox',
              os: p.os || 'windows',
              proxyIp: proxyIp || existing?.proxyIp,
              running: p.isRunning || p.is_running || false,
              nodeUrl: p.nodeUrl,
              nodeName: p.nodeName,
              linkedAccountId: existing?.linkedAccountId,
              linkedAccountName: existing?.linkedAccountName,
              stealthAudit: (summary && summary.overallStatus !== 'NOT_AUDITED') ? {
                processInstanceId: existing?.stealthAudit?.processInstanceId || `bpmn-proc-${p.id.substring(0, 8)}`,
                status: 'COMPLETED',
                overallTrustScore: summary.overallTrustScore,
                overallStatus: summary.overallStatus as any,
                criticalFailureDetected: summary.overallStatus === 'FAILED',
                lastAuditedAt: existing?.stealthAudit?.lastAuditedAt || new Date().toISOString(),
                results: existing?.stealthAudit?.results || [],
              } : (existing?.stealthAudit?.results?.length ? existing.stealthAudit : undefined),
              cookieFarm: summary ? {
                status: existing?.cookieFarm?.status || 'COMPLETED',
                cookiesCount: summary.cookiesCount,
                sitesVisitedCount: summary.sitesVisitedCount,
                lastFarmedAt: existing?.cookieFarm?.lastFarmedAt || new Date().toISOString(),
                recentVisits: existing?.cookieFarm?.recentVisits,
                consentSuccessRate: existing?.cookieFarm?.consentSuccessRate || 100,
                totalDurationSeconds: existing?.cookieFarm?.totalDurationSeconds || 84,
              } : existing?.cookieFarm,
              createdAt: p.createdAt || new Date().toISOString(),
            });
          })
        );
      }
    } catch (err) {
      console.warn('[SpyHub Integration] Could not connect to SpyHub nodes. Using configured fallback profiles.');
    }

    return Promise.all(this.fallbackProfiles.map((p) => this.enrichWithPersona({ ...p })));
  }

  async getProfileById(id: string): Promise<BrowserProfileDto | undefined> {
    const all = await this.getProfiles();
    const profile = all.find((p) => p.profileId === id);
    if (!profile) return undefined;

    try {
      const historyHeaders = await this.botforgeClient.getStealthAuditHistory(id);
      if (historyHeaders && historyHeaders.length > 0) {
        const stealthAuditHistory: StealthAuditVerdictDto[] = historyHeaders.map((header) => {
          const results: StealthServiceResult[] = (header.lines || []).map((r) => ({
            serviceName: r.service,
            statusCode: (r.statusCode || 'PASSED') as any,
            trustScore: r.trustScore ?? 100,
            failedParameters: r.failedParameters || [],
            report: r.report || null,
          }));

          const calculatedTrustScore = results.length > 0
            ? Math.round(results.reduce((acc, r) => acc + (r.trustScore || 0), 0) / results.length)
            : 100;

          const hasFailed = results.some((r) => r.statusCode === 'FAILED');
          const hasFlagged = results.some((r) => r.statusCode === 'FLAGGED');
          const calculatedStatus = hasFailed ? 'FAILED' : hasFlagged ? 'WARNING' : 'PASSED';

          return {
            auditId: header.id,
            processInstanceId: header.processInstanceId || `bpmn-proc-${id.substring(0, 8)}`,
            status: 'COMPLETED',
            overallTrustScore: header.overallTrustScore ?? calculatedTrustScore,
            overallStatus: (header.overallStatus || calculatedStatus) as any,
            criticalFailureDetected: (header.overallStatus || calculatedStatus) === 'FAILED',
            valid: Boolean(header.valid),
            results,
            lastAuditedAt: header.createdAt || new Date().toISOString(),
          };
        });

        profile.stealthAuditHistory = stealthAuditHistory;
        profile.stealthAudit = stealthAuditHistory.find((h) => h.valid) || stealthAuditHistory[0];
      } else {
        const stealthResults = await this.botforgeClient.getStealthCheckResults(id);
        if (stealthResults && stealthResults.length > 0) {
          const results = stealthResults.map((r) => ({
            serviceName: r.service,
            statusCode: (r.statusCode || 'PASSED') as any,
            trustScore: r.trustScore ?? 100,
            failedParameters: r.failedParameters || [],
            report: r.report || null,
          }));

          const latestTime = stealthResults.reduce((max, r) => {
            const t = r.modifiedAt || r.createdAt;
            return t && t > max ? t : max;
          }, '');

          const calculatedTrustScore = Math.round(
            results.reduce((acc, r) => acc + (r.trustScore || 0), 0) / (results.length || 1)
          );

          const hasFailed = results.some((r) => r.statusCode === 'FAILED');
          const hasFlagged = results.some((r) => r.statusCode === 'FLAGGED');
          const calculatedStatus = hasFailed ? 'FAILED' : hasFlagged ? 'WARNING' : 'PASSED';

          const singleVerdict: StealthAuditVerdictDto = {
            processInstanceId: profile.stealthAudit?.processInstanceId || `bpmn-proc-${id.substring(0, 8)}`,
            status: 'COMPLETED',
            overallTrustScore: profile.stealthAudit?.overallTrustScore ?? calculatedTrustScore,
            overallStatus: (profile.stealthAudit?.overallStatus || calculatedStatus) as any,
            criticalFailureDetected: (profile.stealthAudit?.overallStatus || calculatedStatus) === 'FAILED',
            valid: true,
            lastAuditedAt: latestTime || profile.stealthAudit?.lastAuditedAt || new Date().toISOString(),
            results,
          };

          profile.stealthAudit = singleVerdict;
          profile.stealthAuditHistory = [singleVerdict];
        }
      }
    } catch (err) {
      console.warn(`[BotForge API] Failed to fetch stealth audit history for profile ${id}:`, err);
    }

    return profile;
  }

  async startAudit(profileId: string): Promise<StealthAuditVerdictDto> {
    const profile = await this.getProfileById(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    let procInstanceId = `bpmn-proc-${Date.now()}`;
    try {
      const procStart = await this.botforgeClient.startFullStealthAudit(profileId);
      if (procStart?.processInstanceId) {
        procInstanceId = procStart.processInstanceId;
      }
      console.log(`[BotForge API] Started live stealth audit process: ${procInstanceId}`);
    } catch (err) {
      console.warn(`[BotForge API] Could not trigger stealth audit process on BotForge engine.`);
    }

    // Return updated profile stealthAudit if available
    const updatedProfile = await this.getProfileById(profileId);
    if (updatedProfile?.stealthAudit && updatedProfile.stealthAudit.results.length > 0) {
      return updatedProfile.stealthAudit;
    }

    const defaultVerdict: StealthAuditVerdictDto = {
      processInstanceId: procInstanceId,
      status: 'RUNNING',
      overallTrustScore: profile.stealthAudit?.overallTrustScore || 0,
      overallStatus: profile.stealthAudit?.overallStatus || 'WARNING',
      criticalFailureDetected: false,
      lastAuditedAt: new Date().toISOString(),
      results: profile.stealthAudit?.results || [],
    };

    return defaultVerdict;
  }

  async startQuickAudit(profileId: string, services?: string[]): Promise<StealthAuditVerdictDto> {
    const profile = await this.getProfileById(profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    let procInstanceId = `bpmn-proc-${Date.now()}`;
    try {
      const procStart = await this.botforgeClient.startQuickStealthAudit(profileId, {
        services,
        enableEarlyTermination: false,
      });
      if (procStart?.processInstanceId) {
        procInstanceId = procStart.processInstanceId;
      }
      console.log(`[BotForge API] Started quick stealth audit process for ${services?.join(', ')}: ${procInstanceId}`);
    } catch (err) {
      console.warn(`[BotForge API] Could not trigger quick stealth audit process on BotForge engine.`);
    }

    const updatedProfile = await this.getProfileById(profileId);
    if (updatedProfile?.stealthAudit && updatedProfile.stealthAudit.results.length > 0) {
      return updatedProfile.stealthAudit;
    }

    return {
      processInstanceId: procInstanceId,
      status: 'RUNNING',
      overallTrustScore: profile.stealthAudit?.overallTrustScore || 0,
      overallStatus: profile.stealthAudit?.overallStatus || 'WARNING',
      criticalFailureDetected: false,
      lastAuditedAt: new Date().toISOString(),
      results: profile.stealthAudit?.results || [],
    };
  }

  async startProfileInstance(profileId: string): Promise<{ success: boolean }> {
    const profile = await this.getProfileById(profileId);
    const nodeUrl = profile?.nodeUrl || 'http://localhost:8000';
    try {
      await this.spyhubClient.startProfile(nodeUrl, profileId);
      if (profile) profile.running = true;
      return { success: true };
    } catch (err) {
      console.warn(`[SpyHub API] Could not start profile ${profileId} on ${nodeUrl}. Simulating start.`);
      if (profile) profile.running = true;
      return { success: true };
    }
  }

  async stopProfileInstance(profileId: string): Promise<{ success: boolean }> {
    const profile = await this.getProfileById(profileId);
    const nodeUrl = profile?.nodeUrl || 'http://localhost:8000';
    try {
      await this.spyhubClient.stopProfile(nodeUrl, profileId);
    } catch (err) {
      console.warn(`[SpyHub API] Could not stop profile ${profileId} on ${nodeUrl}. Simulating stop.`);
    }
    if (profile) profile.running = false;
    return { success: true };
  }
}
