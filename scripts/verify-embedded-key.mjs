import fs from 'node:fs';
import { parse } from 'dotenv';
import OpenAI from 'openai';
const values = {};
for (const file of ['.env', '.env.local']) if (fs.existsSync(file)) Object.assign(values, parse(fs.readFileSync(file)));
const key = process.env.OPENAI_API_KEY || values.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || values.OPENAI_MODEL || 'gpt-4.1-mini';
if (!key) throw new Error('No existing API key configured');
try {
  const client = new OpenAI({ apiKey: key, timeout: 20000, maxRetries: 0 });
  const result = await client.models.retrieve(model);
  console.log('Existing API key can access the configured model: ' + result.id);
} catch (error) {
  console.error('OpenAI preflight failed: ' + (error.status || error.name));
  process.exitCode = 1;
}
