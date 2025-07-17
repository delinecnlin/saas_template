import axios from 'axios';

const MEM0_API_URL = process.env.MEM0_API_URL;
const MEM0_API_KEY = process.env.MEM0_API_KEY;

export const saveMemory = async (payload) => {
  if (!MEM0_API_URL || !MEM0_API_KEY) {
    throw new Error('mem0 not configured');
  }
  const result = await axios.post(`${MEM0_API_URL}/memory`, payload, {
    headers: { Authorization: MEM0_API_KEY },
  });
  return result.data;
};

export const searchMemory = async (payload) => {
  if (!MEM0_API_URL || !MEM0_API_KEY) {
    throw new Error('mem0 not configured');
  }
  const result = await axios.post(`${MEM0_API_URL}/search`, payload, {
    headers: { Authorization: MEM0_API_KEY },
  });
  return result.data;
};
