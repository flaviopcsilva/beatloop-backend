import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './user.entity/user.entity';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { randomInt, verify } from 'crypto';
import { EmailService } from './email.service';
import { ProfileImageService } from "../profile-image/profile-image.service";
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
    private oauth2Client: OAuth2Client;

    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
        private readonly jwtService: JwtService,
        private readonly ProfileImageService: ProfileImageService
    ) {
        this.oauth2Client = new OAuth2Client('1088646860176-dli8cvcdqm4ush61vft5i7u992bscdj5.apps.googleusercontent.com');
    }

    private creatPayload(user: UserEntity) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            photo: user.profileImage,
            verify: user.isVerified,
            banner: user.profileBanner,
            loginWith: user.loginWith
        };
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async verifyGoogleToken(idToken: string) {
        try {
            const ticket = await this.oauth2Client.verifyIdToken({
                idToken: idToken, // Passando o id_token para verificação
                audience: '1088646860176-dli8cvcdqm4ush61vft5i7u992bscdj5.apps.googleusercontent.com',
            });
            const payload = ticket.getPayload();

            // Após validar o id_token, envie as informações do usuário junto com o access token
            const userData = {
                name: payload.name,
                email: payload.email,
                picture: payload.picture,
            };

            return userData;
        } catch (error) {
            throw new Error('Token inválido');
        }
    }

    async loginOrRegisterGoogleUser(userData: any) {
        const { email, name, picture } = userData;

        // Verificar se o usuário já existe no banco
        let user = await this.userRepository.findOne({ where: { email } });

        if (!user) {
            // Se não encontrar o usuário, criar um novo
            user = this.userRepository.create({
                name,
                email,
                password: 'n/a',
                loginWith: 'google',
                profileImage: picture, // Usar a imagem de perfil do Google
                isVerified: true, // Usuário do Google já é considerado verificado
            });

            await this.userRepository.save(user);
        }

        // Gerar um JWT para o usuário
        const payload = this.creatPayload(user);
        const accessToken = this.jwtService.sign(payload);

        // Retornar tanto o access token quanto os dados do usuário
        return { accessToken };
    }



    async register(name: string, email: string, password: string): Promise<{ accessToken: string }> {
        try {
            if (!name || !email || !password) {
                throw new BadRequestException('Missing required fields');
            }

            const existingUser = await this.userRepository.findOne({ where: { email } });
            if (existingUser) {
                throw new UnauthorizedException('Email already exists');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const verificationCode = randomInt(100000, 999999).toString();
            const verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos para expirar

            const gerarImage = await this.ProfileImageService.generateProfileImage(name);

            const user = this.userRepository.create({
                name,
                email,
                password: hashedPassword,
                verificationCode,
                verificationCodeExpiry,
                isVerified: false,
                loginWith: 'email',
                profileImage: gerarImage,
                profileBanner: '',
            });

            await EmailService(email, verificationCode);

            await this.userRepository.save(user);

            const payload = this.creatPayload(user);;
            const accessToken = this.jwtService.sign(payload);

            return { accessToken };
        } catch (error) {
            console.error('Erro durante o registro:', error);
            throw new InternalServerErrorException('Failed to register user');
        }
    }



    async login(email: string, password: string): Promise<{ accessToken: string }> {
        const user = await this.userRepository.findOne({ where: { email } });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.loginWith == 'google') {
            throw new BadRequestException('This email was registered with google. Please use the google login.');
        }


        if (!email || !password) {
            throw new BadRequestException('Missing required fields');
        }


        if (!user || !user.password || !(await bcrypt.compare(password, user.password))) { // Adicionada verificação para user.password
            throw new BadRequestException('Invalid credentials');
        }


        const payload = this.creatPayload(user);
        const accessToken = this.jwtService.sign(payload);

        return { accessToken };
    }

    async verifyCode(email: string, code: string): Promise<UserEntity> {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new BadRequestException('User not found');
        }
        if (user.isVerified) {
            throw new BadRequestException('Usuário já está verificado');
        }

        if (user.verificationCode !== code) {
            throw new BadRequestException(`Código de verificação inválido${code}`);

        }

        if (new Date() > user.verificationCodeExpiry) {
            throw new BadRequestException('Código expirado');
        }

        user.isVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpiry = null;
        return this.userRepository.save(user);
    }

    async reenviarCode(email: string) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new BadRequestException('User not found');
        }
        if (user.isVerified) {
            throw new BadRequestException('Usuário já está verificado');
        }

        const code = randomInt(100000, 999999).toString();
        user.verificationCode = code;
        user.verificationCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);
        await this.userRepository.save(user);

        await EmailService(email, code);
        return { message: 'Código reenviado com sucesso!' }
    }

    async saveProfileChanges(id: string, email: string, name: string, photo: string) {
        const user = await this.userRepository.findOne({ where: { id } });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.loginWith == 'google') {
            if (email && email !== user.email) {
                throw new BadRequestException('It is not possible to change the email as the login is done through Google.');
            }
        }

        if (!email && !name && !photo) {
            throw new BadRequestException('Nenhuma alteração foi feita');
        }

        if (email) {
            if (!this.isValidEmail(email)) {
                throw new BadRequestException('Email inválido');
            }
            user.email = email;
        }

        if (name) {
            if (name.length < 3) {
                throw new BadRequestException('The name must have at least 3 characters.');
            }
            user.name = name;
        }

        if (photo) {
            user.profileImage = photo;
        }

        await this.userRepository.manager.transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager.save(user);
        });


        const payload = this.creatPayload(user);
        const accessToken = this.jwtService.sign(payload);
        console.log(payload)

        return { message: 'Alterações salvas com sucesso!', accessToken }
    }
}
