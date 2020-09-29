import request from 'request';
import { v4 } from 'uuid';

const key_var = 'TRANSLATOR_TEXT_SUBSCRIPTION_KEY';
if (!process.env[key_var]) {
  throw new Error('Please set/export the following environment variable: ' + key_var);
}
const subscriptionKey = process.env[key_var];
const endpoint_var = 'TRANSLATOR_TEXT_ENDPOINT';
if (!process.env[endpoint_var]) {
  throw new Error('Please set/export the following environment variable: ' + endpoint_var);
}
const endpoint = process.env[endpoint_var];
const region_var = 'TRANSLATOR_TEXT_REGION_AKA_LOCATION';
if (!process.env[region_var]) {
  throw new Error('Please set/export the following environment variable: ' + region_var);
}
const region = process.env[region_var];

function translateText(){
  let options = {
    method: 'POST',
    baseUrl: endpoint,
    url: 'translate',
    qs: {
      'api-version': '3.0',
      'to': ['en']
    },
    headers: {
      'Ocp-Apim-Subscription-Key': subscriptionKey,
      'Ocp-Apim-Subscription-Region': region,
      'Content-type': 'application/json',
      'X-ClientTraceId': v4()
    },
    body: [{
      'text': 'Hello World!'
    }],
    json: true,
  };

  request(options, function(err, res, body){
    console.log(JSON.stringify(body, null, 4));
  });
}

translateText();