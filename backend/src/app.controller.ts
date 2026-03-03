import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { SupabaseService } from './integrations/supabase/supabase.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import type { AuthUser } from './auth/strategies/supabase-jwt.strategy';
import { supabase } from './integrations/supabase/client';

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

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: AuthUser) {
    const { data } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, company, email, phone, avatar_url')
      .eq('id', user.id)
      .single();
    return data ?? {};
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
