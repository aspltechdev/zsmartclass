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








// const transporter = require("../config/mail");

// class EmailService {

//     // ==========================================
//     // Generic Email Sender
//     // ==========================================
//     async sendMail(to, subject, html) {

//         return await transporter.sendMail({

//             from: process.env.SMTP_USER,

//             to,

//             subject,

//             html

//         });

//     }

//     // ==========================================
//     // Registration OTP
//     // ==========================================
//     async sendOTP(email, otp) {

//         return await this.sendMail(

//             email,

//             "Verify your Email - MentorIQ LMS",

//             `
//                 <h2>Email Verification</h2>

//                 <p>Your OTP is</p>

//                 <h1>${otp}</h1>

//                 <p>This OTP expires in 5 minutes.</p>
//             `
//         );

//     }

//     // ==========================================
//     // Reset Password OTP
//     // ==========================================
//     async sendResetOTP(email, otp) {

//         return await this.sendMail(

//             email,

//             "Reset Password OTP",

//             `
//                 <h2>Password Reset</h2>

//                 <p>Your OTP is</p>

//                 <h1>${otp}</h1>

//                 <p>This OTP expires in 5 minutes.</p>
//             `
//         );

//     }

//     // ==========================================
//     // Payment Successful
//     // ==========================================
//     async sendPaymentSuccess(email, studentName, courseTitle, amount) {

//         return await this.sendMail(

//             email,

//             "Payment Successful",

//             `
//                 <h2>Hello ${studentName},</h2>

//                 <p>Your payment was successful.</p>

//                 <h3>${courseTitle}</h3>

//                 <h2>Amount Paid: ₹${amount}</h2>

//                 <p>
//                     Thank you for choosing MentorIQ LMS.
//                 </p>
//             `
//         );

//     }

//     // ==========================================
//     // Welcome After Enrollment
//     // ==========================================
//     async sendWelcomeCourse(email, studentName, courseTitle) {

//         return await this.sendMail(

//             email,

//             "Welcome to MentorIQ LMS",

//             `
//                 <h2>Welcome ${studentName} 👋</h2>

//                 <p>

//                 Congratulations!

//                 </p>

//                 <p>

//                 You are successfully enrolled in

//                 <strong>${courseTitle}</strong>

//                 </p>

//                 <p>

//                 Login and start learning today.

//                 </p>

//                 <br>

//                 <p>Happy Learning!</p>

//                 <h3>MentorIQ Team</h3>
//             `
//         );

//     }

//     // ==========================================
//     // Certificate Ready
//     // ==========================================
//     async sendCertificate(email, studentName, courseTitle, certificateUrl) {

//         return await this.sendMail(

//             email,

//             "Your Certificate is Ready",

//             `
//                 <h2>Congratulations ${studentName} 🎉</h2>

//                 <p>

//                 You have successfully completed

//                 <strong>${courseTitle}</strong>

//                 </p>

//                 <br>

//                 <a href="${certificateUrl}">

//                     Download Certificate

//                 </a>

//                 <br><br>

//                 <p>

//                 Keep Learning with MentorIQ LMS.

//                 </p>
//             `
//         );

//     }


//     async sendWelcomeEmail(user, password) {

//     await transporter.sendMail({

//         from: process.env.SMTP_USER,

//         to: user.email,

//         subject: "Welcome to ZsmartClass LMS",

//         html: `
//             <h2>Welcome ${user.name}</h2>

//             <p>Your LMS account has been created successfully.</p>

//             <table>
//                 <tr>
//                     <td><b>Email</b></td>
//                     <td>${user.email}</td>
//                 </tr>

//                 <tr>
//                     <td><b>Password</b></td>
//                     <td>${password}</td>
//                 </tr>

//                 <tr>
//                     <td><b>Role</b></td>
//                     <td>${user.role}</td>
//                 </tr>
//             </table>

//             <p>
//                 Login:
//                 <a href="http://localhost:5173/login">
//                     Open LMS
//                 </a>
//             </p>

//             <p>Please change your password after your first login.</p>

//         `

//     });

// }

// }

// module.exports = new EmailService();



// src/services/email.service.js
const transporter = require("../config/mail");

class EmailService {

  // ==========================================
  // Generic Email Sender
  // ==========================================
  async sendMail(to, subject, html) {
    try {
      return await transporter.sendMail({
        from: `"ZsmartClass LMS" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
      });
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error.message);
      throw error;
    }
  }

  // ==========================================
  // Registration OTP
  // ==========================================
  async sendOTP(email, otp) {
    return await this.sendMail(
      email,
      "Verify Your Email - ZsmartClass LMS",
      `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h2 { margin: 0; font-size: 24px; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px dashed #667eea; }
            .otp-box h1 { color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0; }
            .info { color: #666; font-size: 14px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🔐 Email Verification</h2>
            </div>
            <div class="content">
              <p>Hello!</p>
              <p>Thank you for registering with ZsmartClass. Use the following OTP to verify your email address:</p>
              
              <div class="otp-box">
                <h1>${otp}</h1>
              </div>
              
              <p class="info">⏰ This OTP expires in <strong>5 minutes</strong>.</p>
              <p class="info">🔒 If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ZsmartClass. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    );
  }

  // ==========================================
  // Reset Password OTP
  // ==========================================
  async sendResetOTP(email, otp) {
    return await this.sendMail(
      email,
      "Reset Your Password - ZsmartClass LMS",
      `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ff6b6b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h2 { margin: 0; font-size: 24px; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px dashed #ff6b6b; }
            .otp-box h1 { color: #ff6b6b; font-size: 36px; letter-spacing: 8px; margin: 0; }
            .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 20px; font-size: 14px; border-left: 4px solid #ffc107; }
            .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🔑 Password Reset</h2>
            </div>
            <div class="content">
              <p>Hello!</p>
              <p>You have requested to reset your password. Use the following OTP to proceed:</p>
              
              <div class="otp-box">
                <h1>${otp}</h1>
              </div>
              
              <div class="warning">
                ⚠️ This OTP expires in <strong>5 minutes</strong>.<br>
                🔒 If you didn't request a password reset, please secure your account immediately.
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ZsmartClass. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    );
  }

  // ==========================================
  // Payment Successful
  // ==========================================
  async sendPaymentSuccess(email, studentName, courseTitle, amount) {
    return await this.sendMail(
      email,
      "Payment Successful - ZsmartClass LMS",
      `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h2 { margin: 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .receipt { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #11998e; }
            .amount { font-size: 32px; color: #11998e; font-weight: bold; text-align: center; margin: 20px 0; }
            .btn { display: inline-block; padding: 12px 30px; background: #11998e; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>✅ Payment Successful</h2>
            </div>
            <div class="content">
              <p>Hello <strong>${studentName}</strong>!</p>
              <p>Your payment has been processed successfully.</p>
              
              <div class="receipt">
                <h3>📚 ${courseTitle}</h3>
                <div class="amount">₹${amount}</div>
                <p style="text-align: center; color: #666;">Amount Paid</p>
              </div>
              
              <p>You now have full access to the course. Start learning today!</p>
              
              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/my-courses" class="btn">
                  Access Your Course →
                </a>
              </center>
            </div>
            <div class="footer">
              <p>Thank you for choosing ZsmartClass!</p>
            </div>
          </div>
        </body>
        </html>
      `
    );
  }

  // ==========================================
  // Welcome After Enrollment
  // ==========================================
  async sendWelcomeCourse(email, studentName, courseTitle) {
    return await this.sendMail(
      email,
      "Welcome to Your Course - ZsmartClass LMS",
      `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .course-badge { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #667eea; }
            .course-badge h3 { color: #667eea; margin: 0; }
            .features { margin: 20px 0; }
            .features li { margin: 10px 0; }
            .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎉 Welcome ${studentName}!</h2>
            </div>
            <div class="content">
              <p>Congratulations! You are now enrolled in:</p>
              
              <div class="course-badge">
                <h3>📚 ${courseTitle}</h3>
              </div>
              
              <ul class="features">
                <li>✅ Full lifetime access to course materials</li>
                <li>✅ Learn at your own pace</li>
                <li>✅ Track your progress</li>
                <li>✅ Earn a certificate upon completion</li>
              </ul>
              
              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/my-courses" class="btn">
                  Start Learning Now 🚀
                </a>
              </center>
              
              <br>
              <p>Happy Learning!</p>
              <p><strong>The ZsmartClass Team</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ZsmartClass. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    );
  }

  // ==========================================
  // Certificate Ready
  // ==========================================
  async sendCertificate(email, studentName, courseTitle, certificateUrl) {
    return await this.sendMail(
      email,
      "Your Certificate is Ready - ZsmartClass LMS",
      `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .certificate-box { background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #f5576c; }
            .btn { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎓 Certificate of Completion</h2>
            </div>
            <div class="content">
              <p>Congratulations <strong>${studentName}</strong>! 🎉</p>
              <p>You have successfully completed:</p>
              
              <div class="certificate-box">
                <h3>📚 ${courseTitle}</h3>
                <p style="color: #666;">Your certificate is ready for download</p>
              </div>
              
              <center>
                <a href="${certificateUrl}" class="btn">
                  📥 Download Certificate
                </a>
              </center>
              
              <p style="margin-top: 20px; color: #666;">
                Keep learning and growing with ZsmartClass!
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ZsmartClass. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    );
  }

  // ==========================================
  // Welcome Email for New Users (Admin Created)
  // ==========================================
  async sendWelcomeEmail(user, password) {
    return await this.sendMail(
      user.email,
      "Welcome to ZsmartClass LMS - Your Account is Ready",
      `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h2 { margin: 0; font-size: 24px; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .credentials table { width: 100%; border-collapse: collapse; }
            .credentials td { padding: 10px 5px; border-bottom: 1px solid #eee; }
            .credentials td:first-child { font-weight: bold; color: #667eea; width: 100px; }
            .password-box { background: #f0f0f0; padding: 8px 12px; border-radius: 4px; font-family: 'Courier New', monospace; letter-spacing: 1px; }
            .btn { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
            .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 20px; border-left: 4px solid #ffc107; font-size: 14px; }
            .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎉 Welcome to ZsmartClass!</h2>
              <p>Your Learning Journey Begins Now</p>
            </div>
            <div class="content">
              <p>Hello <strong>${user.name}</strong>! 👋</p>
              <p>Your LMS account has been created successfully. You can now access all the learning resources and courses available on our platform.</p>
              
              <div class="credentials">
                <h3>📋 Your Account Details</h3>
                <table>
                  <tr>
                    <td>📧 Email</td>
                    <td>${user.email}</td>
                  </tr>
                  <tr>
                    <td>🔑 Password</td>
                    <td><span class="password-box">${password}</span></td>
                  </tr>
                  <tr>
                    <td>👤 Role</td>
                    <td><span style="background: #667eea; color: white; padding: 3px 12px; border-radius: 12px; font-size: 12px;">${user.role}</span></td>
                  </tr>
                </table>
              </div>

              <div class="warning">
                ⚠️ <strong>Security Notice:</strong> For your security, please change your password after your first login.
              </div>

              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="btn">
                  🚀 Login to ZsmartClass
                </a>
              </center>
              
              <p style="margin-top: 20px; color: #666; font-size: 14px;">
                If you have any questions, please contact your administrator.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ZsmartClass LMS. All rights reserved.</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    );
  }

  // ==========================================
  // Password Reset Confirmation (Admin Action)
  // ==========================================
  async sendPasswordResetEmail(user, newPassword) {
    return await this.sendMail(
      user.email,
      "Your Password Has Been Reset - ZsmartClass LMS",
      `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ff6b6b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h2 { margin: 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b6b; }
            .password-box { background: #f0f0f0; padding: 8px 12px; border-radius: 4px; font-family: 'Courier New', monospace; letter-spacing: 1px; }
            .btn { display: inline-block; padding: 12px 30px; background: #ff6b6b; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; font-weight: bold; }
            .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 20px; border-left: 4px solid #ffc107; font-size: 14px; }
            .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🔐 Password Reset Notification</h2>
            </div>
            <div class="content">
              <p>Hello <strong>${user.name}</strong>,</p>
              <p>Your password has been reset by an administrator. Use the following credentials to log in:</p>
              
              <div class="credentials">
                <p><strong>📧 Email:</strong> ${user.email}</p>
                <p><strong>🔑 New Password:</strong> <span class="password-box">${newPassword}</span></p>
              </div>

              <div class="warning">
                ⚠️ <strong>Important:</strong> Please change your password immediately after logging in for security purposes.
              </div>

              <center>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="btn">
                  🔑 Login Now
                </a>
              </center>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ZsmartClass LMS. All rights reserved.</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    );
  }
}

module.exports = new EmailService();