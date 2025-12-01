import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tweetContent, replyContent, sender } = req.body;

  if (!tweetContent || !replyContent) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'dvirzagury@gmail.com'; // Fallback or env
    const senderName = sender || 'Anonymous';
    
    const { data, error } = await resend.emails.send({
      from: 'Updates <onboarding@resend.dev>', // User should verify a domain or use default test one
      to: [adminEmail],
      subject: `New Reply from ${senderName}`,
      html: `
        <h2>New Reply from ${senderName}</h2>
        <p><strong>They replied to:</strong></p>
        <blockquote style="border-left: 4px solid #ccc; padding-left: 1rem; margin-left: 0; color: #555;">
          ${tweetContent}
        </blockquote>
        <p><strong>Reply:</strong></p>
        <blockquote style="border-left: 4px solid #0070f3; padding-left: 1rem; margin-left: 0;">
          ${replyContent}
        </blockquote>
        <p><a href="https://dvir.com/tweets">View in Admin Panel</a></p>
      `
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
