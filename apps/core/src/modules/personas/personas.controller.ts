import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { PersonasService } from './personas.service';
import { CreatePersonaDto, UpdatePersonaDto, PersonaDto } from '@altlab/shared';
import { GeneratePersonaOptions, ToggleSessionRequestDto } from './personas.types';

@Controller('personas')
export class PersonasController {
  constructor(private readonly personasService: PersonasService) {}

  @Get()
  async getPersonas(): Promise<PersonaDto[]> {
    return this.personasService.getPersonas();
  }

  @Get(':id')
  async getPersona(@Param('id') id: string): Promise<PersonaDto> {
    return this.personasService.getPersonaById(id);
  }

  @Post('generate')
  async generatePersona(@Body() options?: GeneratePersonaOptions): Promise<PersonaDto> {
    return this.personasService.generatePersona(options);
  }

  @Post()
  async createPersona(@Body() dto: CreatePersonaDto): Promise<PersonaDto> {
    return this.personasService.createPersona(dto);
  }

  @Put(':id')
  async updatePersona(
    @Param('id') id: string, 
    @Body() dto: UpdatePersonaDto
  ): Promise<PersonaDto> {
    return this.personasService.updatePersona(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePersona(@Param('id') id: string): Promise<void> {
    await this.personasService.deletePersona(id);
  }

  @Post(':id/sessions/toggle')
  async toggleSession(
    @Param('id') personaId: string,
    @Body() body: ToggleSessionRequestDto
  ) {
    return this.personasService.toggleSocialSession(
      personaId,
      body.socialAccountId,
      body.profileId,
      body.action || 'toggle'
    );
  }

  @Post(':id/assign-profile/:profileId')
  async assignProfile(
    @Param('id') personaId: string,
    @Param('profileId') profileId: string
  ) {
    return {
      success: await this.personasService.assignProfileToPersona(personaId, profileId),
    };
  }

  @Delete('unassign-profile/:profileId')
  async unassignProfile(@Param('profileId') profileId: string) {
    return {
      success: await this.personasService.unassignProfile(profileId),
    };
  }
}
