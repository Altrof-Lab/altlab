// TypeScript types mirroring SpyHub API models across multiple nodes

export interface SpyhubProxyConfig {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  type?: string;
}

export interface SpyhubProfile {
  id: string;
  name: string;
  os: 'windows' | 'macos' | 'linux' | string;
  browser: 'camoufox' | 'cloak' | string;
  browser_version?: string;
  browserVersion?: string;
  proxyEnabled?: boolean;
  proxy?: SpyhubProxyConfig;
  isRunning?: boolean;
  is_running?: boolean;
  createdAt?: string;
  lastSessionAt?: string;
}

export interface SpyhubProfilesResponse {
  items: SpyhubProfile[];
}

export interface AggregatedSpyhubProfile extends SpyhubProfile {
  nodeUrl: string;
  nodeName: string;
  nodeStatus: 'online' | 'offline';
}

export interface SpyhubStartResponse {
  ok?: boolean;
  status?: string;
  pid?: number;
}
