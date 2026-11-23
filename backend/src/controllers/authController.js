import crypto from 'crypto';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { sendEmail } from '../utils/mailer.js';

// Helper to hash refresh tokens before storing in DB
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function register(req, res) {
  try {
    const { fullName, username, email, password, confirmPassword } = req.body;

    if (!fullName || !username || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check unique username
    const existingUserByUsername = await User.findOne({ username: cleanUsername });
    if (existingUserByUsername) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    // Check unique email
    const existingUserByEmail = await User.findOne({ email: cleanEmail });
    if (existingUserByEmail) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      fullName: fullName.trim(),
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
      authProviders: ['local'],
      isEmailVerified: true,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName.trim())}`
    });

    const accessToken = signAccessToken({ userId: user._id.toString() });
    const refreshToken = signRefreshToken({ userId: user._id.toString() });

    await RefreshToken.create({
      userId: user._id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      accessToken,
      refreshToken,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('[Register] Error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
}

export async function login(req, res) {
  try {
    const { identifier, password } = req.body; // identifier can be email or username
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Username/Email and Password are required' });
    }

    const cleanId = identifier.trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ username: cleanId }, { email: cleanId }]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.passwordHash) {
      return res.status(401).json({
        success: false,
        message: 'This account was created with Google Sign-In. Please sign in with Google or reset your password.'
      });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const accessToken = signAccessToken({ userId: user._id.toString() });
    const refreshToken = signRefreshToken({ userId: user._id.toString() });

    await RefreshToken.create({
      userId: user._id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    return res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('[Login] Error:', error);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
}

export async function googleAuth(req, res) {
  try {
    const { email, name, googleId, picture } = req.body;

    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Google account details missing' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await User.findOne({
      $or: [{ email: cleanEmail }, { googleId }]
    });

    if (user) {
      // Link Google if not already linked
      let changed = false;
      if (!user.googleId && googleId) {
        user.googleId = googleId;
        changed = true;
      }
      if (!user.authProviders.includes('google')) {
        user.authProviders.push('google');
        changed = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
        changed = true;
      }
      if (changed) {
        await user.save();
      }
    } else {
      // Create new user with unique username derived from email/name
      let baseUsername = (name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || cleanEmail.split('@')[0]).slice(0, 15);
      if (baseUsername.length < 3) baseUsername = 'user' + baseUsername;

      let candidateUsername = baseUsername;
      let counter = 1;
      while (await User.findOne({ username: candidateUsername })) {
        candidateUsername = `${baseUsername}${counter}`;
        counter++;
      }

      user = await User.create({
        username: candidateUsername,
        email: cleanEmail,
        fullName: name.trim(),
        avatar: picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim())}`,
        googleId: googleId || crypto.randomBytes(8).toString('hex'),
        authProviders: ['google'],
        isEmailVerified: true
      });
    }

    const accessToken = signAccessToken({ userId: user._id.toString() });
    const refreshToken = signRefreshToken({ userId: user._id.toString() });

    await RefreshToken.create({
      userId: user._id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    return res.json({
      success: true,
      message: 'Google login successful',
      accessToken,
      refreshToken,
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('[GoogleAuth] Error:', error);
    return res.status(500).json({ success: false, message: 'Google authentication failed' });
  }
}

export async function checkUsername(req, res) {
  try {
    const username = req.params.username?.trim().toLowerCase();
    if (!username || username.length < 3) {
      return res.json({ available: false, message: 'Username must be at least 3 characters' });
    }

    const user = await User.findOne({ username });
    return res.json({ available: !user });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Username check error' });
  }
}

export async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const tokenRecord = await RefreshToken.findOne({
      userId: decoded.userId,
      tokenHash: hashToken(refreshToken)
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return res.status(401).json({ success: false, message: 'Refresh token revoked or expired' });
    }

    // Rotate refresh token
    await RefreshToken.deleteOne({ _id: tokenRecord._id });

    const newAccessToken = signAccessToken({ userId: decoded.userId });
    const newRefreshToken = signRefreshToken({ userId: decoded.userId });

    await RefreshToken.create({
      userId: decoded.userId,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    return res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Token refresh failed' });
  }
}

export async function logout(req, res) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.deleteMany({ tokenHash: hashToken(refreshToken) });
    }
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Logout failed' });
  }
}

export async function getMe(req, res) {
  try {
    return res.json({
      success: true,
      user: req.user.toSafeObject()
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Could not fetch user' });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      // Return success anyway to avoid user enumeration
      return res.json({ success: true, message: 'If an account exists, a password reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'EXPENSELY – Password Reset Request',
      text: `You requested a password reset. Please click this link to reset your password: ${resetUrl}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
          <h2>EXPENSELY Password Reset</h2>
          <p>Hi ${user.fullName},</p>
          <p>You requested to reset your password. Click the button below to choose a new password:</p>
          <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Reset Password</a>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `
    });

    return res.json({
      success: true,
      message: 'If an account exists, a password reset link has been sent.',
      devResetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to process request' });
  }
}

export async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Password reset token is invalid or has expired' });
    }

    user.passwordHash = await hashPassword(newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    if (!user.authProviders.includes('local')) {
      user.authProviders.push('local');
    }
    await user.save();

    return res.json({ success: true, message: 'Password has been successfully updated' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
}
