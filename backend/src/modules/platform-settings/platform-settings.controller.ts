import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../iam/auth.guard';
import { Roles, RolesGuard } from '../iam/roles.guard';
import { UpdatePlatformSettingsDto } from './platform-settings.dto';
import { PlatformSettingsService } from './platform-settings.service';

@ApiTags('Platform Settings')
@Controller()
export class PlatformSettingsController {
  constructor(private readonly service: PlatformSettingsService) {}

  @Get('settings')
  publicSettings() {
    return this.service.publicSettings();
  }

  @Get('admin/settings')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  adminSettings() {
    return this.service.adminSettings();
  }

  @Patch('admin/settings')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  update(@Body() dto: UpdatePlatformSettingsDto) {
    return this.service.update(dto);
  }
}
