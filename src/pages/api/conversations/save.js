import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/server/auth';
import { TableClient } from '@azure/data-tables';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { messages = [] } = req.body || {};
  try {
    const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const table = process.env.AZURE_TABLE_NAME || 'Conversations';
    const client = TableClient.fromConnectionString(conn, table);
    await client.createTable();
    const entity = {
      partitionKey: session.user.email || 'user',
      rowKey: Date.now().toString(),
      messages: JSON.stringify(messages),
    };
    await client.upsertEntity(entity, 'Merge');
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Conversation save error', err);
    return res.status(500).json({ error: 'Failed to save conversation' });
  }
}
