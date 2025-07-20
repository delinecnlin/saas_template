import MemoryClient from 'mem0ai';

let client;

export function getMemoryClient() {
  if (!client) {
    const apiKey = process.env.MEM0_API_KEY || '';
    client = new MemoryClient({ apiKey });
  }
  return client;
}

export const addMemory = async (messages, options = {}) => {
  const mem = getMemoryClient();
  return mem.add(messages, options);
};

export const searchMemory = async (query, options = {}) => {
  const mem = getMemoryClient();
  return mem.search(query, options);
};
