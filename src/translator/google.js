import googleCloudTranslate from '@google-cloud/translate'

const { TranslationServiceClient } = googleCloudTranslate;
const translationClient = new TranslationServiceClient();

const PROJECT_ID = 'anki-vocabulary-bot';
const LOCATION = 'global';

export const translate = async (text, from, to) => {
  const request = {
    parent: `projects/${PROJECT_ID}/locations/${LOCATION}`,
    contents: [text],
    mimeType: 'text/plain',
    sourceLanguageCode: from,
    targetLanguageCode: to,
  };

  const [response] = await translationClient.translateText(request);

  return response.translations[0].translatedText
}