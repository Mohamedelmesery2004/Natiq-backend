import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import {
  analyzeWithNatiq,
  analyzeWithNatiqSafe,
} from '../src/services/qa/natiqAnalysisService.js';
import translatorService from '../src/services/translation/translatorService.js';

test('analyzeWithNatiq sends translated conversation and parses response', async () => {
  const originalPost = axios.post;
  const originalTranslate = translatorService.translateToEnglish;
  let capturedBody = null;

  translatorService.translateToEnglish = async (text) => {
    if (text === 'مرحبا') return 'Hello';
    return text;
  };

  axios.post = async (_url, body) => {
    capturedBody = body;
    return { data: { score: 0.88, verdict: 'ok' } };
  };

  try {
    const result = await analyzeWithNatiq({
      ticketNumber: 'T-1',
      conversation: [
        { role: 'user', content: 'مرحبا', timestamp: '2026-01-01T10:00:00.000Z' },
        { role: 'agent', content: 'Hello, how can I help?', timestamp: '2026-01-01T10:01:00.000Z' },
      ],
    });

    assert.equal(
      capturedBody.conversation,
      'CUSTOMER: Hello\nAGENT: Hello, how can I help?'
    );
    assert.deepEqual(result.analysis, { score: 0.88, verdict: 'ok' });
  } finally {
    translatorService.translateToEnglish = originalTranslate;
    axios.post = originalPost;
  }
});

test('analyzeWithNatiqSafe returns null when Natiq API fails', async () => {
  const originalPost = axios.post;
  axios.post = async () => {
    const error = new Error('socket hang up');
    error.code = 'ECONNRESET';
    throw error;
  };

  try {
    const result = await analyzeWithNatiqSafe({
      ticketNumber: 'T-2',
      conversation: [{ role: 'user', content: 'Need help', timestamp: new Date().toISOString() }],
    });

    assert.equal(result, null);
  } finally {
    axios.post = originalPost;
  }
});

test('analyzeWithNatiqSafe handles timeout errors gracefully', async () => {
  const originalPost = axios.post;
  axios.post = async () => {
    const error = new Error('timeout');
    error.code = 'ECONNABORTED';
    throw error;
  };

  try {
    const result = await analyzeWithNatiqSafe({
      ticketNumber: 'T-3',
      conversation: [{ role: 'user', content: 'مرحبا', timestamp: new Date().toISOString() }],
    });

    assert.equal(result, null);
  } finally {
    axios.post = originalPost;
  }
});
