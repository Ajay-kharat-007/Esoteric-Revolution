import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../iam/auth.guard';

import { Roles, RolesGuard } from '../iam/roles.guard';
import { CatalogueAdminService } from './catalogue-admin.service';
import {
  CreateCategoryDto,
  CreateContributorDto,
  CreateTopicDto,
  UpdateCategoryDto,
  UpdateContributorDto,
  UpdateTopicDto,
} from './catalogue-admin.dto';

@ApiTags('Admin Catalogue')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class CatalogueAdminController {
  constructor(private readonly service: CatalogueAdminService) {}
  @Get('categories') categories() {
    return this.service.categories();
  }
  @Post('categories') createCategory(@Body() dto: CreateCategoryDto) {
    return this.service.createCategory(dto);
  }
  @Patch('categories/:id') updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.service.updateCategory(id, dto);
  }
  @Delete('categories/:id') archiveCategory(@Param('id') id: string) {
    return this.service.archiveCategory(id);
  }
  @Get('topics') topics() {
    return this.service.topics();
  }
  @Post('topics') createTopic(@Body() dto: CreateTopicDto) {
    return this.service.createTopic(dto);
  }
  @Patch('topics/:id') updateTopic(@Param('id') id: string, @Body() dto: UpdateTopicDto) {
    return this.service.updateTopic(id, dto);
  }
  @Delete('topics/:id') archiveTopic(@Param('id') id: string) {
    return this.service.archiveTopic(id);
  }
  @Get('contributors') contributors() {
    return this.service.contributors();
  }
  @Post('contributors') createContributor(@Body() dto: CreateContributorDto) {
    return this.service.createContributor(dto);
  }
  @Patch('contributors/:id') updateContributor(
    @Param('id') id: string,
    @Body() dto: UpdateContributorDto,
  ) {
    return this.service.updateContributor(id, dto);
  }
  @Delete('contributors/:id') archiveContributor(@Param('id') id: string) {
    return this.service.archiveContributor(id);
  }
}
