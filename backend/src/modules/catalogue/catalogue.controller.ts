import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CatalogueQueryDto, SearchQueryDto } from './catalogue.dto';
import { CatalogueService } from './catalogue.service';
@ApiTags('Catalogue')
@Controller()
export class CatalogueController {
  constructor(private readonly catalogue: CatalogueService) {}
  @Get('catalogue/home') home() {
    return this.catalogue.home();
  }
  @Get('works') works(@Query() q: CatalogueQueryDto) {
    return this.catalogue.works(q);
  }
  @Get('works/:slug') work(@Param('slug') s: string) {
    return this.catalogue.work(s);
  }
  @Get('works/:slug/preview') preview(@Param('slug') s: string) {
    return this.catalogue.preview(s);
  }
  @Get('works/:slug/references') references(@Param('slug') s: string) {
    return this.catalogue.references(s);
  }
  @Get('learning-paths') paths() {
    return this.catalogue.paths();
  }
  @Get('learning-paths/:slug') path(@Param('slug') s: string) {
    return this.catalogue.path(s);
  }
  @Get('categories') categories() {
    return this.catalogue.categories();
  }
  @Get('categories/:slug') category(@Param('slug') s: string) {
    return this.catalogue.category(s);
  }
  @Get('topics') topics() {
    return this.catalogue.topics();
  }
  @Get('topics/:slug') topic(@Param('slug') s: string) {
    return this.catalogue.topic(s);
  }
  @Get('people/:slug') person(@Param('slug') s: string) {
    return this.catalogue.person(s);
  }
  @Get('search') search(@Query() q: SearchQueryDto) {
    return this.catalogue.search(q);
  }
  @Get('insights') insights(@Query('page') p?: string, @Query('pageSize') ps?: string) {
    return this.catalogue.insights(Number(p) || 1, Math.min(Number(ps) || 20, 100));
  }
  @Get('insights/:slug') insight(@Param('slug') s: string) {
    return this.catalogue.insight(s);
  }
}
