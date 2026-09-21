import { Injectable } from '@nestjs/common';
import { AxiosInstance } from 'axios';
import { createBotforgeHttpClient } from './botforge-http.client';
import { 
  BrowserStealthCheckResult, 
  ProcessStartResponse, 
  AuditStatusResponse, 
  QuickCheckRequest 
} from './botforge.types';

/**
 * Declarative BotForge API Client.
 * Handles HTTP requests to BotForge Spring Boot automation engine.
 */
@Injectable()
export class BotforgeClient {
  private readonly http: AxiosInstance;

  constructor() {
    this.http = createBotforgeHttpClient();
  }

  /**
   * GET /api/v1/stealth-check/{profileId}
   * Returns all valid browser stealth check reports & verdicts for a profile.
   */
  async getStealthCheckResults(profileId: string): Promise<BrowserStealthCheckResult[]> {
    const response = await this.http.get<BrowserStealthCheckResult[]>(`/api/v1/stealth-check/${profileId}`);
    return response.data;
  }

  /**
   * DELETE /api/v1/stealth-check/{profileId}
   * Deletes browser stealth reports & verdicts for a profile.
   */
  async deleteStealthCheckResults(profileId: string): Promise<void> {
    await this.http.delete(`/api/v1/stealth-check/${profileId}`);
  }

  /**
   * POST /api/v1/stealth-audit/full/{profileId}
   * Starts full BPMN stealth audit workflow for a profile.
   */
  async startFullStealthAudit(profileId: string): Promise<ProcessStartResponse> {
    const response = await this.http.post<ProcessStartResponse>(`/api/v1/stealth-audit/full/${profileId}`);
    return response.data;
  }

  /**
   * POST /api/v1/stealth-audit/quick/{profileId}
   * Starts quick BPMN stealth check for selected services.
   */
  async startQuickStealthAudit(profileId: string, request?: QuickCheckRequest): Promise<ProcessStartResponse> {
    const response = await this.http.post<ProcessStartResponse>(`/api/v1/stealth-audit/quick/${profileId}`, request || {});
    return response.data;
  }

  /**
   * GET /api/v1/stealth-audit/status/{processInstanceId}
   * Returns stealth audit process status and aggregated service results.
   */
  async getStealthAuditStatus(processInstanceId: string): Promise<AuditStatusResponse> {
    const response = await this.http.get<AuditStatusResponse>(`/api/v1/stealth-audit/status/${processInstanceId}`);
    return response.data;
  }
}
