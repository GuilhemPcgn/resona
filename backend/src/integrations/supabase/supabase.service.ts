import { Injectable } from '@nestjs/common';
import { supabase } from './client';

@Injectable()
export class SupabaseService {
  async getProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*');
    
    if (error) throw error;
    return data;
  }

  async getClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*');
    
    if (error) throw error;
    return data;
  }

  async getStudioData() {
    const { data, error } = await supabase
      .from('studio_equipment')
      .select('*');
    
    if (error) throw error;
    return data;
  }
}
