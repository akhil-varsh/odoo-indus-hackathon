import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const ALLOWED_SIGNUP_ROLES = ['INVENTORY_MANAGER', 'WAREHOUSE_STAFF'] as const;
const HARDCODED_ADMIN = {
	name: 'System Admin',
	email: 'admin@coreinventory.local',
	password: 'Admin@123',
	role: 'ADMIN',
};

function signToken(user: { id: string; email: string; role: string }) {
	const secret = process.env.JWT_SECRET;
	if (!secret) {
		throw new Error('JWT_SECRET is not configured');
	}

	return jwt.sign({ email: user.email, role: user.role }, secret, {
		subject: user.id,
		expiresIn: '7d',
	});
}

async function handleSignup(req: any, res: any) {
	try {
		const { name, email, password, role } = req.body;

		if (!name || !email || !password) {
			return res.status(400).json({ error: 'name, email, and password are required' });
		}

		if (role && !ALLOWED_SIGNUP_ROLES.includes(role)) {
			return res.status(400).json({
				error: 'Invalid role. Allowed roles are INVENTORY_MANAGER and WAREHOUSE_STAFF.',
			});
		}

		const existing = await prisma.user.findUnique({ where: { email } });
		if (existing) {
			return res.status(409).json({ error: 'User already exists' });
		}

		const hashed = await bcrypt.hash(password, 10);
		const user = await prisma.user.create({
			data: {
				name,
				email,
				password: hashed,
				role: role || 'WAREHOUSE_STAFF',
			},
		});

		const token = signToken({ id: user.id, email: user.email, role: user.role });
		return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
	} catch (error) {
		return res.status(500).json({ error: 'Failed to sign up user' });
	}
}

router.post('/signup', handleSignup);

router.post('/register', handleSignup);

router.get('/signup-roles', (_req, res) => {
	return res.json({ roles: ALLOWED_SIGNUP_ROLES });
});

router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ error: 'email and password are required' });
		}

		if (email === HARDCODED_ADMIN.email && password === HARDCODED_ADMIN.password) {
			const adminUser = await prisma.user.upsert({
				where: { email: HARDCODED_ADMIN.email },
				update: {
					name: HARDCODED_ADMIN.name,
					role: HARDCODED_ADMIN.role as any,
				},
				create: {
					name: HARDCODED_ADMIN.name,
					email: HARDCODED_ADMIN.email,
					password: await bcrypt.hash(HARDCODED_ADMIN.password, 10),
					role: HARDCODED_ADMIN.role as any,
				},
			});

			const token = signToken({
				id: adminUser.id,
				email: adminUser.email,
				role: adminUser.role,
			});
			return res.json({
				token,
				user: {
					id: adminUser.id,
					name: adminUser.name,
					email: adminUser.email,
					role: adminUser.role,
				},
			});
		}

		const user = await prisma.user.findUnique({ where: { email } });
		if (!user) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const matches = await bcrypt.compare(password, user.password);
		if (!matches) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		const token = signToken({ id: user.id, email: user.email, role: user.role });
		return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
	} catch {
		return res.status(500).json({ error: 'Failed to log in' });
	}
});

router.post('/logout', authenticate, async (_req, res) => {
	return res.json({ message: 'Logged out successfully' });
});

router.get('/me', authenticate, async (req: AuthenticatedRequest, res) => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ error: 'Unauthorized' });
		}

		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
	} catch {
		return res.status(500).json({ error: 'Failed to fetch profile' });
	}
});

router.post('/password-reset/request-otp', async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) {
			return res.status(400).json({ error: 'email is required' });
		}

		const user = await prisma.user.findUnique({ where: { email } });
		if (!user) {
			return res.json({ message: 'If email exists, an OTP has been issued.' });
		}

		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

		await prisma.passwordResetOtp.create({
			data: {
				userId: user.id,
				otp,
				expiresAt,
			},
		});

		return res.json({
			message: 'OTP generated successfully',
			otp,
			expiresAt,
			note: 'For production, send OTP via email/SMS provider and do not return OTP in API response.',
		});
	} catch {
		return res.status(500).json({ error: 'Failed to request OTP' });
	}
});

router.post('/password-reset/verify-otp', async (req, res) => {
	try {
		const { email, otp, newPassword } = req.body;

		if (!email || !otp || !newPassword) {
			return res.status(400).json({ error: 'email, otp, and newPassword are required' });
		}

		const user = await prisma.user.findUnique({ where: { email } });
		if (!user) {
			return res.status(400).json({ error: 'Invalid OTP or email' });
		}

		const resetRecord = await prisma.passwordResetOtp.findFirst({
			where: {
				userId: user.id,
				otp,
				used: false,
				expiresAt: { gt: new Date() },
			},
			orderBy: { createdAt: 'desc' },
		});

		if (!resetRecord) {
			return res.status(400).json({ error: 'Invalid or expired OTP' });
		}

		const hashed = await bcrypt.hash(newPassword, 10);

		await prisma.$transaction([
			prisma.user.update({ where: { id: user.id }, data: { password: hashed } }),
			prisma.passwordResetOtp.update({ where: { id: resetRecord.id }, data: { used: true } }),
		]);

		return res.json({ message: 'Password reset successful' });
	} catch {
		return res.status(500).json({ error: 'Failed to verify OTP' });
	}
});

export default router;
