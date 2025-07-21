import MemoryClient from 'mem0ai';

const MEM0_API_KEY = process.env.MEM0_API_KEY;

let client;

export const getMem0Client = () => {
  if (!MEM0_API_KEY) {
    throw new Error('MEM0_API_KEY not configured');
  }
  if (!client) {
    client = new MemoryClient({ apiKey: MEM0_API_KEY });
  }
  return client;
};

export const addMemories = async (messages, options = {}) => {
  try {
    return await getMem0Client().add(messages, options);
  } catch (e) {
    console.error('[mem0] add error:', e);
    return [];
  }
};

export const searchMemories = async (query, options = {}) => {
  try {
    return await getMem0Client().search(query, options);
  } catch (e) {
    console.error('[mem0] search error:', e);
    return [];
  }
};
