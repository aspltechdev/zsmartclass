// const transporter = require("../config/mail");

// class EmailService {

//     async sendOTP(email, otp) {

//         await transporter.sendMail({
//             from: process.env.SMTP_USER,
//             to: email,
//             subject: "Verify your Email - LMS",
//             html: `
//                 <h2>Email Verification</h2>

//                 <p>Your OTP is</p>

//                 <h1>${otp}</h1>

//                 <p>This OTP expires in 5 minutes.</p>
//             `
//         });

//     }

//     async sendResetOTP(email, otp) {

//     await transporter.sendMail({
//         from: process.env.SMTP_USER,
//         to: email,
//         subject: "Reset Password OTP",
//         html: `
//             <h2>Password Reset</h2>

//             <p>Your OTP is</p>

//             <h1>${otp}</h1>

//             <p>Valid for 5 minutes.</p>
//         `
//     });

// }

// }

// module.exports = new EmailService();
const transporter = require("../config/mail");

class EmailService {

    // ==========================================
    // Generic Email Sender
    // ==========================================
    async sendMail(to, subject, html) {

        return await transporter.sendMail({

            from: process.env.SMTP_USER,

            to,

            subject,

            html

        });

    }

    // ==========================================
    // Registration OTP
    // ==========================================
    async sendOTP(email, otp) {

        return await this.sendMail(

            email,

            "Verify your Email - MentorIQ LMS",

            `
                <h2>Email Verification</h2>

                <p>Your OTP is</p>

                <h1>${otp}</h1>

                <p>This OTP expires in 5 minutes.</p>
            `
        );

    }

    // ==========================================
    // Reset Password OTP
    // ==========================================
    async sendResetOTP(email, otp) {

        return await this.sendMail(

            email,

            "Reset Password OTP",

            `
                <h2>Password Reset</h2>

                <p>Your OTP is</p>

                <h1>${otp}</h1>

                <p>This OTP expires in 5 minutes.</p>
            `
        );

    }

    // ==========================================
    // Payment Successful
    // ==========================================
    async sendPaymentSuccess(email, studentName, courseTitle, amount) {

        return await this.sendMail(

            email,

            "Payment Successful",

            `
                <h2>Hello ${studentName},</h2>

                <p>Your payment was successful.</p>

                <h3>${courseTitle}</h3>

                <h2>Amount Paid: ₹${amount}</h2>

                <p>
                    Thank you for choosing MentorIQ LMS.
                </p>
            `
        );

    }

    // ==========================================
    // Welcome After Enrollment
    // ==========================================
    async sendWelcomeCourse(email, studentName, courseTitle) {

        return await this.sendMail(

            email,

            "Welcome to MentorIQ LMS",

            `
                <h2>Welcome ${studentName} 👋</h2>

                <p>

                Congratulations!

                </p>

                <p>

                You are successfully enrolled in

                <strong>${courseTitle}</strong>

                </p>

                <p>

                Login and start learning today.

                </p>

                <br>

                <p>Happy Learning!</p>

                <h3>MentorIQ Team</h3>
            `
        );

    }

    // ==========================================
    // Certificate Ready
    // ==========================================
    async sendCertificate(email, studentName, courseTitle, certificateUrl) {

        return await this.sendMail(

            email,

            "Your Certificate is Ready",

            `
                <h2>Congratulations ${studentName} 🎉</h2>

                <p>

                You have successfully completed

                <strong>${courseTitle}</strong>

                </p>

                <br>

                <a href="${certificateUrl}">

                    Download Certificate

                </a>

                <br><br>

                <p>

                Keep Learning with MentorIQ LMS.

                </p>
            `
        );

    }

}

module.exports = new EmailService();