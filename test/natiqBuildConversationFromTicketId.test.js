import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildConversationFromTicketId,
} from '../src/services/qa/natiqAnalysisService.js';
import ticketService from '../src/services/ticketService.js';
import { ChatSession } from '../src/models/index.js';
import translatorService from '../src/services/translation/translatorService.js';

test('buildConversationFromTicketId builds translated conversation from snapshot', async () => {
  const originalGetTicketById = ticketService.getTicketById;
  const originalTranslate = translatorService.translateToEnglish;

  ticketService.getTicketById = async () => ({
    context: {
      conversationSnapshot: [
        { role: 'user', content: 'مرحبا', timestamp: '2026-01-01T10:00:00.000Z' },
        { role: 'assistant', content: '...', timestamp: '2026-01-01T10:00:01.000Z' },
        { role: 'assistant', content: 'كيف اقدر اساعدك', timestamp: '2026-01-01T10:00:02.000Z' },
      ],
    },
  });

  translatorService.translateToEnglish = async (text) => {
    if (text === 'مرحبا') return 'Hello';
    if (text === 'كيف اقدر اساعدك') return 'How can I help you';
    return text;
  };

  try {
    const result = await buildConversationFromTicketId('c1', 't1');
    assert.equal(
      result.conversation,
      'CUSTOMER: Hello\nAGENT: How can I help you'
    );
  } finally {
    ticketService.getTicketById = originalGetTicketById;
    translatorService.translateToEnglish = originalTranslate;
  }
});

test('buildConversationFromTicketId falls back when translation fails', async () => {
  const originalGetTicketById = ticketService.getTicketById;
  const originalTranslate = translatorService.translateToEnglish;

  ticketService.getTicketById = async () => ({
    context: {
      conversationSnapshot: [
        { role: 'user', content: 'مرحبا', timestamp: '2026-01-01T10:00:00.000Z' },
      ],
    },
  });

  translatorService.translateToEnglish = async () => {
    throw new Error('translator unavailable');
  };

  try {
    const result = await buildConversationFromTicketId('c1', 't1');
    assert.equal(result.conversation, 'CUSTOMER: مرحبا');
  } finally {
    ticketService.getTicketById = originalGetTicketById;
    translatorService.translateToEnglish = originalTranslate;
  }
});

test('buildConversationFromTicketId uses ChatSession messages when snapshot missing', async () => {
  const originalGetTicketById = ticketService.getTicketById;
  const originalFindOne = ChatSession.findOne;

  ticketService.getTicketById = async () => ({
    context: { sessionId: 'S1', conversationSnapshot: [] },
  });

  ChatSession.findOne = () => ({
    select: async () => ({
      messages: [{ role: 'agent', content: 'Hello', timestamp: '2026-01-01T10:00:00.000Z' }],
    }),
  });

  try {
    const result = await buildConversationFromTicketId('c1', 't1');
    assert.equal(result.conversation, 'AGENT: Hello');
  } finally {
    ticketService.getTicketById = originalGetTicketById;
    ChatSession.findOne = originalFindOne;
  }
});
