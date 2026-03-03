import { Injectable, NotFoundException } from '@nestjs/common';
import { supabase } from '../integrations/supabase/client';
import { ProjectProgressService } from '../projects/project-progress.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionsService {
  constructor(private readonly projectProgress: ProjectProgressService) {}
  async findAll(
    userId: string,
    page: number,
    limit: number,
    filters: { project_id?: string; start_date?: string; end_date?: string; status?: string; session_type?: string },
  ) {
    const offset = (page - 1) * limit;

    let query = supabase
      .from('sessions')
      .select('*, clients(name, company)', { count: 'exact' })
      .eq('user_id', userId)
      .order('start_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.project_id) {
      query = query.eq('project_id', filters.project_id);
    }
    if (filters.start_date) {
      query = query.gte('start_date', filters.start_date);
    }
    if (filters.end_date) {
      query = query.lte('end_date', filters.end_date);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.session_type) {
      query = query.eq('session_type', filters.session_type);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: data ?? [], total: count ?? 0 };
  }

  async findOne(id: string, userId: string) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*, clients(name, company)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Session ${id} not found`);
    }
    return data;
  }

  async create(userId: string, dto: CreateSessionDto) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({ ...dto, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    if (data?.project_id) void this.projectProgress.recalculate(data.project_id as string);
    return data;
  }

  async update(id: string, userId: string, dto: UpdateSessionDto) {
    const existing = await this.findOne(id, userId);

    const { data, error } = await supabase
      .from('sessions')
      .update(dto)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    if (existing?.project_id) void this.projectProgress.recalculate(existing.project_id as string);
    return data;
  }

  async remove(id: string, userId: string) {
    const existing = await this.findOne(id, userId);

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    if (existing?.project_id) void this.projectProgress.recalculate(existing.project_id as string);
  }
}
