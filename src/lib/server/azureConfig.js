export const gptDefaultParams = {
  temperature: 0.8,
  top_p: 0.95,
  frequency_penalty: 0,
  presence_penalty: 0,
  max_tokens: 2000,
};

const modelConfigs = {
  'gpt-4o': {
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
  },
  'gpt-4o-mini': {
    apiKey: process.env.AZURE_OPENAI_MINI_API_KEY || process.env.AZURE_OPENAI_API_KEY,
    endpoint: process.env.AZURE_OPENAI_MINI_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT,
    deployment: process.env.AZURE_OPENAI_MINI_DEPLOYMENT || process.env.AZURE_OPENAI_DEPLOYMENT,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
  },
};

export function getGptConfig(model = 'gpt-4o') {
  return modelConfigs[model] || modelConfigs['gpt-4o'];
}

export function getRealtimeConfig() {
  return {
    endpoint: process.env.AZURE_OPENAI_REALTIME_ENDPOINT,
    deployment: process.env.AZURE_OPENAI_REALTIME_DEPLOYMENT,
    apiKey: process.env.AZURE_REALTIME_KEY,
    region: process.env.AZURE_OPENAI_REALTIME_REGION,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
  };
}

export function getImageConfig() {
  return {
    endpoint:
      process.env.AZURE_OPENAI_IMAGE_ENDPOINT ||
      process.env.AZURE_OPENAI_REALTIME_ENDPOINT ||
      process.env.AZURE_OPENAI_ENDPOINT,
    deployment:
      process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT ||
      process.env.AZURE_OPENAI_REALTIME_DEPLOYMENT ||
      process.env.AZURE_OPENAI_DEPLOYMENT,
    apiKey:
      process.env.AZURE_OPENAI_IMAGE_API_KEY ||
      process.env.AZURE_REALTIME_KEY ||
      process.env.AZURE_OPENAI_API_KEY,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
  };
}
