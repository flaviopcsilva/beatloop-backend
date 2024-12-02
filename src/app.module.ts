import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileImageModule } from './profile-image/profile-image.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static'; 

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'Machado@Luan121107',
      database: 'beatloop',
      autoLoadEntities: true,
      synchronize: true
    }),
    ProfileImageModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'), // Diretório para servir as imagens
      serveRoot: '/uploads', // URL base para acessar as imagens
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
