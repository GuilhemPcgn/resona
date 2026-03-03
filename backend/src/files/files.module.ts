import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AudioProcessingModule } from '../audio-processing/audio-processing.module';
import { ProjectsModule } from '../projects/projects.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [AuthModule, AudioProcessingModule, ProjectsModule],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
