import { Injectable } from '@nestjs/common';
import { createSpyhubHttpClient } from './spyhub-http.client';
import { 
  SpyhubProfile, 
  SpyhubProfilesResponse, 
  AggregatedSpyhubProfile,
  SpyhubNodeStatus,
  SpyhubStartResponse
} from './spyhub.types';

interface CachedNodeStatus {
  isOnline: boolean;
  lastChecked: number;
}

/**
 * Declarative Multi-Node SpyHub API Client.
 * Aggregates browser profiles from multiple SpyHub nodes (e.g. macOS & Windows hosts).
 */
@Injectable()
export class SpyhubClient {
  private nodeUrls: string[];
  private nodeStatusCache: Map<string, CachedNodeStatus> = new Map();
  private readonly CACHE_TTL_MS = 10000; // 10 seconds offline cache TTL

  constructor() {
    // Read list of SpyHub URLs from env (comma-separated), e.g. "http://localhost:8000,http://192.168.1.120:8000"
    const rawUrls = process.env.SPYHUB_URLS || 'http://localhost:8000,http://192.168.1.120:8000';
    this.nodeUrls = rawUrls.split(',').map((u) => u.trim()).filter(Boolean);
  }

  getNodeUrls(): string[] {
    return this.nodeUrls;
  }

  /**
   * GET /profiles from a single SpyHub node with 800ms fast-fail timeout
   */
  async getProfilesFromNode(nodeUrl: string): Promise<SpyhubProfile[]> {
    const http = createSpyhubHttpClient(nodeUrl, 800);
    const response = await http.get<SpyhubProfilesResponse>('/profiles');
    return response.data.items || [];
  }

  /**
   * Checks health and latency for each configured SpyHub node.
   */
  async getNodeStatuses(): Promise<SpyhubNodeStatus[]> {
    const results = await Promise.allSettled(
      this.nodeUrls.map(async (nodeUrl) => {
        const start = Date.now();
        const isLocal = nodeUrl.includes('localhost') || nodeUrl.includes('127.0.0.1');
        const nodeName = isLocal ? 'SpyHub macOS (Local)' : `SpyHub Windows (${nodeUrl.replace(/^https?:\/\//, '')})`;
        const os = isLocal ? 'macos' : 'windows';

        try {
          const profiles = await this.getProfilesFromNode(nodeUrl);
          const responseTimeMs = Date.now() - start;
          this.nodeStatusCache.set(nodeUrl, { isOnline: true, lastChecked: Date.now() });
          return {
            nodeUrl,
            nodeName,
            os,
            status: 'online' as const,
            responseTimeMs,
            profileCount: profiles.length,
          };
        } catch (err) {
          this.nodeStatusCache.set(nodeUrl, { isOnline: false, lastChecked: Date.now() });
          return {
            nodeUrl,
            nodeName,
            os,
            status: 'offline' as const,
            profileCount: 0,
          };
        }
      })
    );

    return results.map((res, index) => {
      if (res.status === 'fulfilled') {
        return res.value;
      }
      const nodeUrl = this.nodeUrls[index];
      const isLocal = nodeUrl.includes('localhost') || nodeUrl.includes('127.0.0.1');
      return {
        nodeUrl,
        nodeName: isLocal ? 'SpyHub macOS (Local)' : `SpyHub Windows (${nodeUrl.replace(/^https?:\/\//, '')})`,
        os: isLocal ? 'macos' : 'windows',
        status: 'offline' as const,
        profileCount: 0,
      };
    });
  }

  /**
   * Aggregates profiles from ALL configured SpyHub nodes concurrently.
   * If a node was detected offline within 10s TTL, skips waiting for socket timeout.
   */
  async getAllProfiles(): Promise<AggregatedSpyhubProfile[]> {
    const now = Date.now();

    const results = await Promise.allSettled(
      this.nodeUrls.map(async (nodeUrl) => {
        const cached = this.nodeStatusCache.get(nodeUrl);
        // If node was confirmed offline less than 10 seconds ago, fail fast immediately (0ms wait)
        if (cached && !cached.isOnline && (now - cached.lastChecked) < this.CACHE_TTL_MS) {
          return [];
        }

        try {
          const items = await this.getProfilesFromNode(nodeUrl);
          const isLocal = nodeUrl.includes('localhost') || nodeUrl.includes('127.0.0.1');
          const nodeName = isLocal ? 'SpyHub macOS' : `SpyHub Windows`;

          this.nodeStatusCache.set(nodeUrl, { isOnline: true, lastChecked: now });

          return items.map((profile): AggregatedSpyhubProfile => ({
            ...profile,
            nodeUrl,
            nodeName,
            nodeStatus: 'online',
          }));
        } catch (err) {
          this.nodeStatusCache.set(nodeUrl, { isOnline: false, lastChecked: now });
          return [];
        }
      })
    );

    const aggregatedProfiles: AggregatedSpyhubProfile[] = [];

    results.forEach((res) => {
      if (res.status === 'fulfilled') {
        aggregatedProfiles.push(...res.value);
      }
    });

    return aggregatedProfiles;
  }

  /**
   * POST /profiles/{profile_id}/start on a specific SpyHub node
   */
  async startProfile(nodeUrl: string, profileId: string): Promise<SpyhubStartResponse> {
    const http = createSpyhubHttpClient(nodeUrl, 3000);
    const response = await http.post<SpyhubStartResponse>(`/profiles/${profileId}/start`);
    return response.data;
  }

  /**
   * POST /profiles/{profile_id}/stop on a specific SpyHub node
   */
  async stopProfile(nodeUrl: string, profileId: string): Promise<void> {
    const http = createSpyhubHttpClient(nodeUrl, 3000);
    await http.post(`/profiles/${profileId}/stop`);
  }
}
