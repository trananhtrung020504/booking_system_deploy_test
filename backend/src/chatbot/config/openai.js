import { ChatOpenAI } from '@langchain/openai';
import { ENV_VARS } from '../../config/env_vars.js';

export const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0,
  openAIApiKey: ENV_VARS.OPENAI_API_KEY,
});
