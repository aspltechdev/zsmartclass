


const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateOTP = require("../utils/generateOTP");
const emailService = require("./email.service");

class AuthService {

    async register(data) {

        const { name, email, password } = data;

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            throw new Error("Email already registered");
        }

        await prisma.pendingUser.deleteMany({
            where: { email }
        });

        const otp = generateOTP();

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.pendingUser.create({
            data: {
                name,
                email,
                password: hashedPassword,
                otp,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000)
            }
        });

        await emailService.sendOTP(email, otp);

        return {
            success: true,
            message: "OTP sent successfully."
        };

    }

    async verifyOTP(data) {

        const { email, otp } = data;

        const pendingUser = await prisma.pendingUser.findUnique({
            where: { email }
        });

        if (!pendingUser) {
            throw new Error("Registration not found.");
        }

        if (pendingUser.expiresAt < new Date()) {

            await prisma.pendingUser.delete({
                where: { email }
            });

            throw new Error("OTP has expired.");
        }

        if (pendingUser.otp !== otp) {
            throw new Error("Invalid OTP.");
        }

        const user = await prisma.user.create({
            data: {
                name: pendingUser.name,
                email: pendingUser.email,
                password: pendingUser.password,
                emailVerified: true
            }
        });

        await prisma.pendingUser.delete({
            where: { email }
        });

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return {
            success: true,
            message: "Registration successful.",
            token,
            user
        };

    }

    async login(data) {

    const { email, password } = data;

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error("User not found.");
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
        throw new Error("Invalid password.");
    }

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );

    return {
        success: true,
        message: "Login successful.",
        token,
        user
    };
}

async forgotPassword(data) {

    const { email } = data;

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error("User not found.");
    }

    await prisma.passwordReset.deleteMany({
        where: { email }
    });

    const otp = generateOTP();

    await prisma.passwordReset.create({
        data: {
            email,
            otp,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        }
    });

    await emailService.sendResetOTP(email, otp);

    return {
        success: true,
        message: "Password reset OTP sent."
    };
}

async verifyResetOTP(data) {

    const { email, otp } = data;

    const otpRecord = await prisma.passwordReset.findFirst({
        where: {
            email
        }
    });

    if (!otpRecord) {
        throw new Error("OTP not found.");
    }

    if (otpRecord.expiresAt < new Date()) {

        await prisma.passwordReset.delete({
            where: {
                id: otpRecord.id
            }
        });

        throw new Error("OTP expired.");
    }

    if (otpRecord.otp !== otp) {
        throw new Error("Invalid OTP.");
    }

    return {
        success: true,
        message: "OTP Verified"
    };

}

async resetPassword(data) {

    const { email, password } = data;

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error("User not found.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
        where: {
            email
        },
        data: {
            password: hashedPassword
        }
    });

    await prisma.passwordReset.deleteMany({
        where: {
            email
        }
    });

    return {
        success: true,
        message: "Password updated successfully."
    };

}

async resendResetOTP(data) {

    const { email } = data;

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error("User not found.");
    }

    await prisma.passwordReset.deleteMany({
        where: { email }
    });

    const otp = generateOTP();

    await prisma.passwordReset.create({
        data: {
            email,
            otp,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        }
    });

    await emailService.sendResetOTP(email, otp);

    return {
        success: true,
        message: "OTP resent successfully."
    };

}
}

module.exports = new AuthService();