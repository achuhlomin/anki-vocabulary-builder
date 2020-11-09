import textToSpeech from '@google-cloud/text-to-speech'

const client = new textToSpeech.TextToSpeechClient();

const isExist = async (s3, filename) => {
  try {
    const headObjectParams = {
      Key: filename,
    }

    await s3.headObject(headObjectParams).promise()

    return true;
  } catch (e) {
    return false;
  }
}

export const tts = async ({text, name, s3}) => {
  const filename = `${name}.mp3`;
  const exist = await isExist(s3, filename)
  const promises = [];

  if (!exist) {
    const ssParams = {
      input: {text: text},
      voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
      audioConfig: {audioEncoding: 'MP3'},
    }

    const [{audioContent}] = await client.synthesizeSpeech(ssParams);

    const uploadParams = {
      Key: filename,
      Body: audioContent
    }

    const uploadPromise = s3.upload(uploadParams).promise();

    promises.push(uploadPromise)
  }

  const getSignedUrlPromise = s3.getSignedUrlPromise('getObject', {
    Key: filename,
    Expires: 60 * 5
  });

  promises.push(getSignedUrlPromise)

  const [url] = await Promise.all(promises.reverse())

  return url;
}