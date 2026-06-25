/* v2.0.0 | Remove hardcoded fallback secret */
export async function sendNotification(title: string, body: string, topic: string = 'admin_notifications') {
  const secret = import.meta.env.VITE_NOTIFY_SECRET_KEY;
  if (!secret) return; // Silent skip if not configured
  try {
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`
      },
      body: JSON.stringify({ title, body, topic })
    });
    if (!response.ok) {
      console.warn('Push notification gagal:', await response.text());
    }
  } catch (error) {
    console.error('Error menghubungi endpoint notifikasi:', error);
  }
}
