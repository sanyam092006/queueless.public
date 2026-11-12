import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Queue from './models/Queue.js';
import Token from './models/Token.js';
import { formatLabel } from './utils/label.js';

const names = ['Aarav Sharma', 'Priya Verma', 'Rohan Gupta', 'Ananya Singh', 'Karan Mehta',
  'Neha Kapoor', 'Vikram Joshi', 'Isha Malhotra', 'Rahul Khanna', 'Sneha Reddy'];

const queuesData = [
  { name: 'Bank Cash Counter', prefix: 'B', avgServiceTime: 4, description: 'Deposits, withdrawals and cash services',
    statuses: ['served', 'served', 'served', 'cancelled', 'serving', 'waiting', 'waiting', 'waiting'] },
  { name: 'Hospital OPD Registration', prefix: 'H', avgServiceTime: 6, description: 'New patient registration and appointment slips',
    statuses: ['served', 'served', 'cancelled', 'serving', 'waiting', 'waiting', 'waiting', 'waiting', 'waiting'] },
  { name: 'Passport Seva Desk', prefix: 'P', avgServiceTime: 10, description: 'Document verification and biometrics',
    statuses: ['served', 'serving', 'waiting', 'waiting'] },
  { name: 'University Admission Office', prefix: 'U', avgServiceTime: 7, description: 'Admission queries and fee receipts', status: 'closed',
    statuses: ['served', 'served', 'served', 'cancelled', 'served'] },
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Clearing old data...');
  await Promise.all([Token.deleteMany(), Queue.deleteMany(), User.deleteMany()]);

  const admin = await User.create({ name: 'Admin', email: 'admin@queueless.com', password: 'Admin@123', role: 'admin' });
  const users = [];
  for (let i = 0; i < names.length; i++) {
    users.push(await User.create({
      name: names[i],
      email: i === 0 ? 'user@queueless.com' : `user${i}@queueless.com`,
      password: 'User@123',
    }));
  }

  for (const { statuses, ...data } of queuesData) {
    const queue = await Queue.create({ ...data, createdBy: admin._id });
    const now = Date.now();
    const docs = statuses.map((status, i) => ({
      queue: queue._id,
      user: users[i % users.length]._id,
      number: i + 1,
      label: formatLabel(queue.prefix, i + 1),
      status,
      calledAt: ['served', 'serving'].includes(status) ? new Date(now - (statuses.length - i) * 4 * 60000) : undefined,
      servedAt: status === 'served' ? new Date(now - (statuses.length - i - 1) * 4 * 60000) : undefined,
      cancelledAt: status === 'cancelled' ? new Date(now - 30 * 60000) : undefined,
    }));
    await Token.insertMany(docs);

    const servingIdx = statuses.lastIndexOf('serving');
    const lastServedIdx = statuses.lastIndexOf('served');
    queue.lastNumber = statuses.length;
    queue.nowServing = (servingIdx >= 0 ? servingIdx : lastServedIdx) + 1;
    await queue.save();
    console.log(`Seeded queue: ${queue.name} (${statuses.length} tokens)`);
  }

  console.log('\nDone! Demo logins:');
  console.log('  Admin: admin@queueless.com / Admin@123');
  console.log('  User : user@queueless.com  / User@123');
  await mongoose.disconnect();
};

run().catch((err) => { console.error(err); process.exit(1); });
