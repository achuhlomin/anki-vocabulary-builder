import util from 'util'
import childProcess from 'child_process'
import got from "got";
import {tts} from "../api/index.js"
import AWS from "aws-sdk";

const exec = util.promisify(childProcess.exec)

const S3_BUCKET_NAME = 'anki-vocabulary-migration1';

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
} = process.env

const s3 = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
  region: 'eu-central-1',
  params: {
    Bucket: S3_BUCKET_NAME,
  },
});

const ids = [
  369837507,
  339253577,
]

const anki = {
  369837507: {
    deckName: '8. Vocabulary Builder'
  },
}

const sync = async (endpoint) => {
  const { body } = await got.post(endpoint, {
    json: {
      action: 'sync',
      version: 6
    },
    responseType: 'json'
  });

  return body
}

const getNotes = async (endpoint, deckName) => {
  const { body: {result: noteIds} } = await got.post(endpoint, {
    json: {
      action: "findNotes",
      version: 6,
      params: {
        query: `"note:${deckName}"`
      }
    },
    responseType: 'json'
  });

  return noteIds
}

const getNoteInfo = async (endpoint, noteId) => {
  const { body: {result: [info]} } = await got.post(endpoint, {
    json: {
      action: "notesInfo",
      version: 6,
      params: {
        notes: [noteId]
      }
    },
    responseType: 'json'
  });

  return info
}

const updateNoteFields = async (endpoint, noteId, fields) => {
  const { word: {value: word}, def: {value: def}, voice: {value: currentVoice}} = fields

  if (currentVoice) return

  const voice = await tts({
    text: def,
    name: `${word}`,
    s3,
  })

  const id = word

  await got.post(endpoint, {
    json: {
      action: "updateNoteFields",
      version: 6,
      params: {
        note: {
          id: noteId, // update by note id
          fields: { // update id field(isn't note id)
            id,
          },
          audio: [{ // update voice field
            url: voice,
            filename: `vocabulary-def-${id}.mp3`,
            fields: [
              "voice"
            ]
          }]
        }
      }
    },
    responseType: 'json'
  });
}

const migration = async (endpoint, {noteType}) => {
  const noteIds = await getNotes(endpoint, noteType)

  for(let i = 0; i < noteIds.length; i++) {
    const noteId = noteIds[i]
    const {fields} = await getNoteInfo(endpoint, noteId)
    await updateNoteFields(endpoint, noteId, fields)
  }
}

for(let i = 0; i <= ids.length; i++) {
  const id = ids[i]
  const {stdout: ip} = await exec(`docker container inspect anki_${id} | jq '.[0].NetworkSettings.IPAddress' | sed 's/"//g' | tr -d '\n'`)
  const meta = anki[id]
  const endpoint = `http://${ip}:8765`
  const deckName = meta && meta.deckName ? meta.deckName : 'Vocabulary Builder'
  const noteType = 'Vocabulary Builder'

  await sync(endpoint)
  await migration(endpoint, {deckName, noteType})
  await sync(endpoint)
}