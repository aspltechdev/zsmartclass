const transporter = require("../config/mail");

class EmailService {

    async sendOTP(email, otp) {

        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: email,
            subject: "Verify your Email - LMS",
            html: `
                <h2>Email Verification</h2>

                <p>Your OTP is</p>

                <h1>${otp}</h1>

                <p>This OTP expires in 5 minutes.</p>
            `
        });

    }

    async sendResetOTP(email, otp) {

    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: "Reset Password OTP",
        html: `
            <h2>Password Reset</h2>

            <p>Your OTP is</p>

            <h1>${otp}</h1>

            <p>Valid for 5 minutes.</p>
        `
    });

}

}

module.exports = new EmailService();