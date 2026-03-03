import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/supabase-jwt.strategy';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@UseGuards(JwtAuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /** Liste tous les commentaires d'un fichier audio */
  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('file_id', ParseUUIDPipe) fileId: string,
  ) {
    return this.commentsService.findAll(fileId, user.id);
  }

  /** Crée un commentaire */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(user.id, dto);
  }

  /** Met à jour is_resolved d'un commentaire */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: { is_resolved: boolean },
  ) {
    return this.commentsService.update(id, user.id, { is_resolved: body.is_resolved });
  }

  /** Supprime un commentaire */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.commentsService.remove(id, user.id);
  }
}
