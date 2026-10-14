import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/User.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function provisionAdmin() {
  const args = process.argv.slice(2);
  let email = 'admin@vynora.edu';
  let password = '';
  let name = 'Platform Administrator';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) email = args[++i];
    if (args[i] === '--password' && args[i + 1]) password = args[++i];
    if (args[i] === '--name' && args[i + 1]) name = args[++i];
  }

  if (!password || password.length < 8) {
    console.error('Usage: node server/scripts/create_admin.mjs --email <admin_email> --password <strong_password> [--name <admin_name>]');
    console.error('Error: A secure password of at least 8 characters is required.');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI is not defined in .env.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const cleanEmail = email.trim().toLowerCase();

  let admin = await User.findOne({ email: cleanEmail });
  if (admin) {
    console.info(`[Admin Provisioning] Updating existing administrator: ${cleanEmail}`);
    admin.name = name.trim();
    admin.passwordHash = User.hashPassword(password);
    admin.role = 'ADMIN';
    admin.isVerified = true;
    admin.isSuspended = false;
    await admin.save();
    console.info('[Admin Provisioning] Administrator password rotated successfully.');
  } else {
    admin = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash: User.hashPassword(password),
      role: 'ADMIN',
      isVerified: true,
      avatarColor: '#153b33',
      academicProfile: {
        university: 'SR University',
        department: 'Academic Administration',
        degree: 'Faculty / Administration',
        year: 'Dean Office'
      },
      skills: ['Academic Administration', 'Governance', 'Campus Security'],
      interest: 'Digital campus operational infrastructure',
      bio: 'Administrator for Vynora Campus platform and academic governance.'
    });
    console.info(`[Admin Provisioning] New administrator provisioned: ${cleanEmail}`);
  }

  await mongoose.disconnect();
}

provisionAdmin().catch((err) => {
  console.error('[Admin Provisioning Error]', err.message);
  process.exit(1);
});
