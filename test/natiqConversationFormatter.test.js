import test from 'node:test';
import assert from 'node:assert/strict';
import { buildConversationForNatiq } from '../src/services/qa/natiqConversationFormatter.js';

test('buildConversationForNatiq preserves chronological ordering and labels', () => {
  const ticket = {
    conversation: [
      { role: 'agent', content: 'Sure', timestamp: '2026-01-01T10:02:00.000Z' },
      { role: 'user', content: 'I need help', timestamp: '2026-01-01T10:01:00.000Z' },
      { role: 'admin', content: 'Hello', timestamp: '2026-01-01T10:00:00.000Z' },
    ],
  };

  const result = buildConversationForNatiq(ticket);
  assert.equal(
    result.conversation,
    'AGENT: Hello\nCUSTOMER: I need help\nAGENT: Sure'
  );
});

test('buildConversationForNatiq ignores empty and internal/system messages', () => {
  const ticket = {
    conversation: [
      { role: 'system', content: 'system', timestamp: '2026-01-01T10:00:00.000Z' },
      { role: 'user', content: '   ', timestamp: '2026-01-01T10:01:00.000Z' },
      {
        role: 'agent',
        content: 'visible',
        timestamp: '2026-01-01T10:02:00.000Z',
        meta: { type: 'normal' },
      },
      {
        role: 'agent',
        content: 'hidden escalation',
        timestamp: '2026-01-01T10:03:00.000Z',
        meta: { type: 'system_escalation' },
      },
    ],
  };

  const result = buildConversationForNatiq(ticket);
  assert.equal(result.conversation, 'AGENT: visible');
});
