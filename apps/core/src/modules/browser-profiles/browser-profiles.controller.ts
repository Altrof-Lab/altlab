import { Controller, Get, Post, Param } from '@nestjs/common';
import { BrowserProfilesService } from './browser-profiles.service';
import { BrowserProfileDto, StealthAuditVerdictDto } from '@altlab/shared';

@Controller('affiliate/browser-profiles')
export class BrowserProfilesController {
  constructor(private readonly profilesService: BrowserProfilesService) {}

  @Get()
  getProfiles(): BrowserProfileDto[] {
    return this.profilesService.getProfiles();
  }

  @Get(':id')
  getProfileById(@Param('id') id: string): BrowserProfileDto | undefined {
    return this.profilesService.getProfileById(id);
  }

  @Post(':id/audit')
  async startAudit(@Param('id') id: string): Promise<StealthAuditVerdictDto> {
    return this.profilesService.startAudit(id);
  }
}
