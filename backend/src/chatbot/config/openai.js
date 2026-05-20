import { ChatOpenAI } from '@langchain/openai';
import { ENV_VARS } from '../../config/env_vars.js';

export const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0,
  openAIApiKey: ENV_VARS.OPENAI_API_KEY || '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',
});
