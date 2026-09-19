import { Controller, Get, Post, Body } from '@nestjs/common';
import { AffiliateService } from './affiliate.service';
import { AffiliateAccountDto, CreateAffiliateAccountDto } from '@altlab/shared';

@Controller('affiliate/accounts')
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  @Get()
  getAccounts(): AffiliateAccountDto[] {
    return this.affiliateService.getAccounts();
  }

  @Post()
  createAccount(@Body() dto: CreateAffiliateAccountDto): AffiliateAccountDto {
    return this.affiliateService.createAccount(dto);
  }
}
