import { Injectable } from '@nestjs/common';
import { createCanvas } from 'canvas';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ProfileImageService {
    async generateProfileImage(name: string): Promise<string> {
        const initials = name
            .split(' ')
            .map((word) => word[0].toUpperCase())
            .join('');

        const canvas = createCanvas(500, 500);
        const context = canvas.getContext('2d');

        //Fundo da imagem
        context.fillStyle = '#1A1B1D';
        context.fillRect(0, 0, canvas.width, canvas.height);


        // Adicionar o nome ao centro da imagem
        context.font = 'bold 200px Arial'; // Estilo da fonte
        context.fillStyle = '#FFFFFF'; // Cor do texto
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(initials, canvas.width / 2, canvas.height / 2);
        return canvas.toDataURL('image/png');
    }

}
