import * as nodemailer from 'nodemailer'
export const EmailService = async (email: string, code: string) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'machado.luandealmeida@gmail.com',
            pass: 'kpnw fgeh ljhs vyqm'
        }
    })

    await transporter.sendMail({
        from: 'machado.luandealmeida@gmail.com',
        to: email,
        subject: 'Código de verificação',
        text: `Seu código de verificação é: ${code}`
    })
}
