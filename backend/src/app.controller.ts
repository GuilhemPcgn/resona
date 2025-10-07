import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SupabaseService } from './integrations/supabase/supabase.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/projects')
  async getProjects() {
    return await this.supabaseService.getProjects();
  }

  @Get('api/clients')
  async getClients() {
    return await this.supabaseService.getClients();
  }

  @Get('api/studio')
  async getStudioData() {
    return await this.supabaseService.getStudioData();
  }
}
