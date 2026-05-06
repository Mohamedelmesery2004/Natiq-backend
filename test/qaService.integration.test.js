import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import config from '../src/config/index.js';
import qaService from '../src/services/qaService.js';

test('analyzeRaw preserves old analysis when Natiq fails', async () => {
  const originalPost = axios.post;
  const originalApiKey = config.groq.apiKey;
  config.groq.apiKey = 'test-key';

  let callCount = 0;
  axios.post = async (url) => {
    callCount += 1;

    if (url.includes('/chat/completions')) {
      return {
        data: {
          choices: [{ message: { content: JSON.stringify({ qa: 'ok' }) } }],
          usage: { total_tokens: 42 },
        },
      };
    }

    throw new Error('Natiq down');
  };

  try {
    const result = await qaService.analyzeRaw({
      ticketNumber: 'T-11',
      conversation: [{ role: 'user', content: 'hello', timestamp: new Date().toISOString() }],
    });

    assert.deepEqual(result.analysis, { qa: 'ok' });
    assert.deepEqual(result.oldAnalysis, { qa: 'ok' });
    assert.equal(result.natiqAnalysis, null);
    assert.ok(callCount >= 2);
  } finally {
    config.groq.apiKey = originalApiKey;
    axios.post = originalPost;
  }
});
