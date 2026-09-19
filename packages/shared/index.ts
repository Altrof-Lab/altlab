// Shared DTOs, schemas, and API contracts between apps/core and apps/dashboard

export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: string;
}

export interface ServerStatusDto {
  id: string;
  name: string;
  ip: string;
  status: 'online' | 'offline' | 'degraded';
  uptimeSeconds: number;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  containersCount: number;
  virtualMachinesCount: number;
}
