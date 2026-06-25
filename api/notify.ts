import * as admin from 'firebase-admin';
import type { VercelRequest, VercelResponse } from '@vercel/node';

if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Hanya terima POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Wajib kirim secret key dari web biar gak ditembak sembarang orang
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.NOTIFY_SECRET_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { title, body, topic = 'admin_notifications' } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  try {
    const message = {
      notification: {
        title,
        body,
      },
      topic,
    };

    const response = await admin.messaging().send(message);
    res.status(200).json({ success: true, messageId: response });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
}
