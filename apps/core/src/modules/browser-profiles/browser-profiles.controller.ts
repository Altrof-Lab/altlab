import { Controller, Get, Post, Param } from '@nestjs/common';
import { BrowserProfilesService } from './browser-profiles.service';
import { BrowserProfileDto, StealthAuditVerdictDto, SpyhubNodeStatusDto } from '@altlab/shared';

@Controller('affiliate/browser-profiles')
export class BrowserProfilesController {
  constructor(private readonly profilesService: BrowserProfilesService) {}

  @Get()
  async getProfiles(): Promise<BrowserProfileDto[]> {
    return this.profilesService.getProfiles();
  }

  @Get('nodes')
  async getNodeStatuses(): Promise<SpyhubNodeStatusDto[]> {
    return this.profilesService.getNodeStatuses();
  }

  @Get(':id')
  async getProfileById(@Param('id') id: string): Promise<BrowserProfileDto | undefined> {
    return this.profilesService.getProfileById(id);
  }

  @Post(':id/audit')
  async startAudit(@Param('id') id: string): Promise<StealthAuditVerdictDto> {
    return this.profilesService.startAudit(id);
  }
}
