import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserEntity } from './user.entity/user.entity';
import { GoogleAuthDto } from './models';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }



  @Post('register')
  async register(@Body('name') name: string, @Body('email') email: string, @Body('password') password: string) {
    return this.authService.register(name, email, password);
  }

  @Post('login')
  async login(@Body('email') email: string, @Body('password') password: string) {
    return this.authService.login(email, password);
  }

  @Post('verify')
  async verify(@Body() { email, code }: { email: string, code: string }) {
    await this.authService.verifyCode(email, code);
    return { message: 'Usuário verificado com sucesso!' }
  }

  @Post('reenviar')
  async reenviar(@Body('email') email: string) {
    return this.authService.reenviarCode(email);
  }

  @Post('google')
  async googleLogin(@Body() googleAuthDto: GoogleAuthDto) {
    const { token } = googleAuthDto;
    // Verifique o token com a API do Google (use uma biblioteca como google-auth-library)
    const user = await this.authService.verifyGoogleToken(token);
    if (user) {
      // Verifique se o usuário já existe no banco de dados
      return this.authService.loginOrRegisterGoogleUser(user);
      return console.log(user)
    } else {
      throw new Error('Token inválido');
    }
  }

  @Post('update')
  async updateProfile(@Body('id') id: string, @Body('email') email: string, @Body('name') name: string, @Body('photo') photo: string, @Body('banner') bannerPhoto: string) {
    return this.authService.saveProfileChanges(id, email, name, photo, bannerPhoto);
  }

}
