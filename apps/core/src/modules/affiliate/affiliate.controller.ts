import { Controller, Get, Post, Body } from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { AffiliateAccountDto, CreateAffiliateAccountDto } from '@altlab/shared';

@Controller('affiliate/accounts')
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  @Get()
  async getAccounts(): Promise<AffiliateAccountDto[]> {
    return this.affiliateService.getAccounts();
  }

  @Post()
  async createAccount(@Body() dto: CreateAffiliateAccountDto): Promise<AffiliateAccountDto> {
    return this.affiliateService.createAccount(dto);
  }
}
