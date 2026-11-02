import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../iam/auth.guard';
import { Roles, RolesGuard } from '../iam/roles.guard';
import {
  CreateInsightDto,
  CreateLearningPathDto,
  UpdateInsightDto,
  UpdateLearningPathDto,
} from './content-discovery-admin.dto';
import { ContentDiscoveryAdminService } from './content-discovery-admin.service';

@ApiTags('Admin Learning Paths & Insights')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class ContentDiscoveryAdminController {
  constructor(private readonly service: ContentDiscoveryAdminService) {}

  @Get('learning-paths') learningPaths() {
    return this.service.learningPaths();
  }
  @Post('learning-paths') createLearningPath(@Body() dto: CreateLearningPathDto) {
    return this.service.createLearningPath(dto);
  }
  @Get('learning-paths/:id') learningPath(@Param('id') id: string) {
    return this.service.learningPath(id);
  }
  @Patch('learning-paths/:id') updateLearningPath(
    @Param('id') id: string,
    @Body() dto: UpdateLearningPathDto,
  ) {
    return this.service.updateLearningPath(id, dto);
  }
  @Delete('learning-paths/:id') archiveLearningPath(@Param('id') id: string) {
    return this.service.archiveLearningPath(id);
  }

  @Get('insights') insights() {
    return this.service.insights();
  }
  @Post('insights') createInsight(@Body() dto: CreateInsightDto) {
    return this.service.createInsight(dto);
  }
  @Get('insights/:id') insight(@Param('id') id: string) {
    return this.service.insight(id);
  }
  @Patch('insights/:id') updateInsight(@Param('id') id: string, @Body() dto: UpdateInsightDto) {
    return this.service.updateInsight(id, dto);
  }
  @Delete('insights/:id') archiveInsight(@Param('id') id: string) {
    return this.service.archiveInsight(id);
  }
}
