import { Injectable } from '@nestjs/common';
import { createSpyhubHttpClient } from './spyhub-http.client';
import { 
  SpyhubProfile, 
  SpyhubProfilesResponse, 
  AggregatedSpyhubProfile,
  SpyhubStartResponse
} from './spyhub.types';

/**
 * Declarative Multi-Node SpyHub API Client.
 * Aggregates browser profiles from multiple SpyHub nodes (e.g. macOS & Windows hosts).
 */
@Injectable()
export class SpyhubClient {
  private nodeUrls: string[];

  constructor() {
    // Read list of SpyHub URLs from env (comma-separated), e.g. "http://localhost:8000,http://192.168.1.120:8000"
    const rawUrls = process.env.SPYHUB_URLS || 'http://localhost:8000,http://192.168.1.120:8000';
    this.nodeUrls = rawUrls.split(',').map((u) => u.trim()).filter(Boolean);
  }

  getNodeUrls(): string[] {
    return this.nodeUrls;
  }

  /**
   * GET /profiles from a single SpyHub node
   */
  async getProfilesFromNode(nodeUrl: string): Promise<SpyhubProfile[]> {
    const http = createSpyhubHttpClient(nodeUrl);
    const response = await http.get<SpyhubProfilesResponse>('/profiles');
    return response.data.items || [];
  }

  /**
   * Aggregates profiles from ALL configured SpyHub nodes concurrently.
   * Handles offline nodes gracefully without failing the entire request.
   */
  async getAllProfiles(): Promise<AggregatedSpyhubProfile[]> {
    const results = await Promise.allSettled(
      this.nodeUrls.map(async (nodeUrl) => {
        const items = await this.getProfilesFromNode(nodeUrl);
        const isLocal = nodeUrl.includes('localhost') || nodeUrl.includes('127.0.0.1');
        const nodeName = isLocal ? 'macOS Node (Local)' : `Windows Node (${nodeUrl.replace(/^https?:\/\//, '')})`;

        return items.map((profile): AggregatedSpyhubProfile => ({
          ...profile,
          nodeUrl,
          nodeName,
          nodeStatus: 'online',
        }));
      })
    );

    const aggregatedProfiles: AggregatedSpyhubProfile[] = [];

    results.forEach((res, index) => {
      if (res.status === 'fulfilled') {
        aggregatedProfiles.push(...res.value);
      } else {
        const failedUrl = this.nodeUrls[index];
        console.warn(`[SpyHub Integration] Node ${failedUrl} is currently offline/unreachable.`);
      }
    });

    return aggregatedProfiles;
  }

  /**
   * POST /profiles/{profile_id}/start on a specific SpyHub node
   */
  async startProfile(nodeUrl: string, profileId: string): Promise<SpyhubStartResponse> {
    const http = createSpyhubHttpClient(nodeUrl);
    const response = await http.post<SpyhubStartResponse>(`/profiles/${profileId}/start`);
    return response.data;
  }

  /**
   * POST /profiles/{profile_id}/stop on a specific SpyHub node
   */
  async stopProfile(nodeUrl: string, profileId: string): Promise<void> {
    const http = createSpyhubHttpClient(nodeUrl);
    await http.post(`/profiles/${profileId}/stop`);
  }
}
