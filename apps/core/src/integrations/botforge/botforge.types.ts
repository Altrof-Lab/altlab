// TypeScript types mirroring BotForge Spring Boot API models

export interface StealthValidationVerdict {
  verdictScore?: number;
  status?: 'PASSED' | 'FAILED' | 'FLAGGED' | string;
  notes?: string;
  details?: Record<string, any>;
}

export interface StealthReport {
  serviceName?: string;
  timestamp?: string;
  rawResponse?: Record<string, any>;
  detectedFlags?: string[];
}

export interface BrowserStealthCheckResult {
  id: number;
  profileId: string;
  sessionId?: string;
  ipAddress?: string;
  service: string;
  report?: StealthReport;
  verdict?: StealthValidationVerdict;
  valid: boolean;
  createdAt: string;
  modifiedAt?: string;
}

export interface ProcessStartResponse {
  processInstanceId: string;
  status: string;
  message?: string;
}

export interface QuickCheckRequest {
  enableEarlyTermination?: boolean;
  services?: string[];
}

export interface ServiceCheckResult {
  serviceName: string;
  statusCode: 'PASSED' | 'FAILED' | 'FLAGGED' | string;
  trustScore: number;
  failedParameters?: string[];
}

export interface AuditStatusResponse {
  processInstanceId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | string;
  overallTrustScore?: number;
  overallStatus?: 'PASSED' | 'WARNING' | 'FAILED' | string;
  criticalFailureDetected?: boolean;
  results: ServiceCheckResult[];
}
