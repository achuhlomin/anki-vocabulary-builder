import axios from 'axios';
import {v4} from 'uuid';

const subscriptionKey = process.env.TRANSLATOR_TOKEN;
const endpoint = "https://api.cognitive.microsofttranslator.com";

export const lookup = async (text, from, to) => {
  const lookupResp = await axios({
    baseURL: endpoint,
    url: 'dictionary/lookup',
    method: 'post',
    headers: {
      'Ocp-Apim-Subscription-Key': subscriptionKey,
      'Content-type': 'application/json',
      'X-ClientTraceId': v4()
    },
    params: {
      'api-version': '3.0',
      'from': from,
      'to': to
    },
    data: [{
      'text': text
    }],
    responseType: 'json'
  })

  return lookupResp.data[0].translations.map(t => t.normalizedTarget)
}

export const translate = async (text, from, to) => {
  const lookupResp = await axios({
    baseURL: endpoint,
    url: 'translate',
    method: 'post',
    headers: {
      'Ocp-Apim-Subscription-Key': subscriptionKey,
      'Content-type': 'application/json',
      'X-ClientTraceId': v4()
    },
    params: {
      'api-version': '3.0',
      'from': from,
      'to': to
    },
    data: [{
      'text': text
    }],
    responseType: 'json'
  })

  return lookupResp.data[0].translations[0].text
}
