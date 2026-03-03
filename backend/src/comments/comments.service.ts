import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { supabase } from '../integrations/supabase/client';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  async findAll(fileId: string, userId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('file_id', fileId)
      .eq('user_id', userId)
      .order('timestamp_start', { ascending: true, nullsFirst: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data ?? [];
  }

  async create(userId: string, dto: CreateCommentDto) {
    const { data, error } = await supabase
      .from('comments')
      .insert({ ...dto, user_id: userId })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async update(
    id: string,
    userId: string,
    fields: { is_resolved?: boolean },
  ) {
    const { data, error } = await supabase
      .from('comments')
      .update(fields)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) throw new NotFoundException(`Comment ${id} not found`);
    return data;
  }

  async remove(id: string, userId: string) {
    const { data, error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) throw new NotFoundException(`Comment ${id} not found`);
  }
}
