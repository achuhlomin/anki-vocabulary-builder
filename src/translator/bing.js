import axios from 'axios';
import {v4} from 'uuid';

const BING_TOKEN = process.env.BING_TOKEN;

const endpoint = "https://api.cognitive.microsofttranslator.com";

export const detect = async (text) => {
  const lookupResp = await axios({
    baseURL: endpoint,
    url: 'detect',
    method: 'post',
    headers: {
      'Ocp-Apim-Subscription-Key': BING_TOKEN,
      'Content-type': 'application/json',
      'X-ClientTraceId': v4()
    },
    params: {
      'api-version': '3.0',
    },
    data: [{
      'text': text
    }],
    responseType: 'json'
  })

  return lookupResp.data[0].language
}

export const translate = async (text, from, to) => {
  const lookupResp = await axios({
    baseURL: endpoint,
    url: 'translate',
    method: 'post',
    headers: {
      'Ocp-Apim-Subscription-Key': BING_TOKEN,
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

export const lookup = async (term, from, to) => {
  const lookupResp = await axios({
    baseURL: endpoint,
    url: 'dictionary/lookup',
    method: 'post',
    headers: {
      'Ocp-Apim-Subscription-Key': BING_TOKEN,
      'Content-type': 'application/json',
      'X-ClientTraceId': v4()
    },
    params: {
      'api-version': '3.0',
      'from': from,
      'to': to
    },
    data: [{
      'text': term
    }],
    responseType: 'json'
  })

  return lookupResp.data[0].translations.map(t => t.normalizedTarget)
}
