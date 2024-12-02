import { Module } from '@nestjs/common';
import { ProfileImageService } from './profile-image.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [ServeStaticModule.forRoot({
    rootPath: join(__dirname, '..', 'uploads'), // Diretório para servir as imagens
    serveRoot: '/uploads', // URL base para acessar as imagens
  }),],
  providers: [ProfileImageService]
})
export class ProfileImageModule { }
