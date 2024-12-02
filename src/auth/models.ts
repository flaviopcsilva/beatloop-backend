export class GoogleAuthDto {
    token: string;
}

export class CreateUserDto {
    email: string;
    firstName: string;
    lastName: string;
    // Outros campos que você quiser salvar no banco
  }