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
  // INVITATION EMAIL - NEW
  // ==========================================
  async sendInvitationEmail(user, token) {
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const invitationLink = `${FRONTEND_URL}/register/invite?token=${token}`;

    return await this.sendMail(
      user.email,
      "You're Invited to Join ZsmartClass!",
      `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h2 { margin: 0; font-size: 24px; }
            .header p { margin: 10px 0 0; opacity: 0.9; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .role-badge { display: inline-block; background: #667eea; color: white; padding: 4px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; }
            .btn { display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .info-box p { margin: 5px 0; }
            .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin-top: 20px; border-left: 4px solid #ffc107; font-size: 14px; }
            .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎓 You're Invited!</h2>
              <p>Join ZsmartClass - The Future of Learning</p>
            </div>
            <div class="content">
              <p>Hello <strong>${user.name}</strong>! 👋</p>
              <p>An administrator has invited you to join <strong>ZsmartClass</strong>, a modern Learning Management System.</p>
              
              <div class="info-box">
                <p><strong>📧 Email:</strong> ${user.email}</p>
                <p><strong>👤 Role:</strong> <span class="role-badge">${user.role}</span></p>
              </div>
              
              <p>Click the button below to set up your account and start learning:</p>
              
              <center>
                <a href="${invitationLink}" class="btn">🚀 Complete Registration</a>
              </center>
              
              <div class="warning">
                ⏰ This invitation link will expire in <strong>48 hours</strong>.<br>
                🔒 If you didn't request this, please ignore this email.
              </div>
              
              <p style="margin-top: 20px; color: #666; font-size: 14px;">
                Need help? Contact your administrator.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ZsmartClass. All rights reserved.</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    );
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
  // Welcome Email for New Users (Admin Created - Legacy)
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