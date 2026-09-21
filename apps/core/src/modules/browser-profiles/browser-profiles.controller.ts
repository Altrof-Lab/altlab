import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { BrowserProfilesService } from './browser-profiles.service';
import { BrowserProfileDto, StealthAuditVerdictDto, SpyhubNodeStatusDto, SpyhubNodeConfigDto, SingleNodeDataDto } from '@altlab/shared';

@Controller('affiliate/browser-profiles')
export class BrowserProfilesController {
  constructor(private readonly profilesService: BrowserProfilesService) {}

  @Get()
  async getProfiles(): Promise<BrowserProfileDto[]> {
    return this.profilesService.getProfiles();
  }

  @Get('nodes/config')
  getNodeConfigs(): SpyhubNodeConfigDto[] {
    return this.profilesService.getNodeConfigs();
  }

  @Get('node-data')
  async getNodeData(@Query('nodeUrl') nodeUrl: string): Promise<SingleNodeDataDto> {
    return this.profilesService.getNodeData(nodeUrl);
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
