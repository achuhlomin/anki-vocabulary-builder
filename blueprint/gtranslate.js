import gtranslate from '@google-cloud/translate'

const { TranslationServiceClient } = gtranslate;

const projectId = 'anki-vocabulary-bot';
const location = 'global';
const text = 'нора';

// Instantiates a client
const translationClient = new TranslationServiceClient();
async function translateText() {
  // Construct request
  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: [text],
    mimeType: 'text/plain', // mime types: text/plain, text/html
    sourceLanguageCode: 'ru',
    targetLanguageCode: 'en',
  };

  try {
    // Run request
    const [response] = await translationClient.translateText(request);

    for (const translation of response.translations) {
      console.log(`Translation: ${translation.translatedText}`);
    }
  } catch (error) {
    console.error(error.details);
  }
}

await translateText();