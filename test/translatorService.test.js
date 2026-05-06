import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import {
  TranslatorService,
  BaseTranslationProvider,
  hasArabic,
} from '../src/services/translation/translatorService.js';

test('hasArabic detects Arabic text correctly', () => {
  assert.equal(hasArabic('مرحبا'), true);
  assert.equal(hasArabic('Hello there'), false);
});

test('TranslatorService keeps English text unchanged', async () => {
  class IdentityProvider extends BaseTranslationProvider {
    async translateToEnglish(text) {
      return text;
    }
  }

  const service = new TranslatorService(new IdentityProvider());
  const translated = await service.translateToEnglish('Hello customer');
  assert.equal(translated, 'Hello customer');
});

test('TranslatorService can translate Arabic text via provider', async () => {
  const originalPost = axios.post;
  axios.post = async () => ({
    data: { choices: [{ message: { content: 'I need support' } }] },
  });

  try {
    const service = new TranslatorService({
      translateToEnglish: async (text) => {
        const response = await axios.post('https://example.com', { text });
        return response.data.choices[0].message.content;
      },
    });

    const translated = await service.translateToEnglish('احتاج مساعدة');
    assert.equal(translated, 'I need support');
  } finally {
    axios.post = originalPost;
  }
});
