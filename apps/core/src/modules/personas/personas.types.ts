export interface GeneratePersonaOptions {
  gender?: 'MALE' | 'FEMALE';
  countryCode?: string; // Default: 'EE'
  minAge?: number;
  maxAge?: number;
}

export interface ToggleSessionRequestDto {
  personaId: string;
  socialAccountId: string;
  profileId: string;
  action?: 'login' | 'logout' | 'toggle';
}

export interface AssignProfileRequestDto {
  profileId: string;
}
