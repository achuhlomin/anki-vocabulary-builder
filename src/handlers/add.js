import AWS from 'aws-sdk'
import {getConnect} from "../helpers/index.js"
import {tts} from "../api/index.js"

import {
  addNote,
  sync,
} from "../anki/index.js";

export const onAddHandler = async (ctx) => {
  try {
    const { state } = ctx
    const { redisClient, s3BucketName, awsAccessKeyId, awsSecretAccessKey } = state
    const messageId = ctx.update.callback_query.message.message_id
    const {headword, offset} = JSON.parse(await redisClient.get(`message:${messageId}`))

    if (!headword) {
      await ctx.answerCbQuery()

      throw new Error(
        `Failure! Add persistent cache 💩`
      )
    }

    const {endpoint, deckName} = await getConnect(ctx)
    const syncBefore = await sync(endpoint)

    if (!syncBefore || syncBefore.error) {
      await ctx.answerCbQuery()

      throw new Error(
        `Failure! Sync not available, please try again later 🏓`
      )
    }

    const {definitions, alternatives, translations} = JSON.parse(await redisClient.get(`headword:${headword}`))

    const {
      def,
      region,
      poses,
      gram,
      phonUK,
      phonUS,
      urlUK,
      urlUS,
      examples,
    } = definitions[offset];

    const s3 = new AWS.S3({
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
      signatureVersion: 'v4',
      region: 'eu-central-1',
      params: {
        Bucket: s3BucketName,
      },
    });

    const voice = await tts({
      text: def,
      name: `${headword}-${offset}`,
      s3,
    })

    const {error} = await addNote(endpoint, deckName, {
      headword,
      region,
      poses,
      gram,
      def,
      voice,
      urlUK,
      urlUS,
      phonUK,
      phonUS,
      examples,
      alternatives,
      translations,
    })

    if (error) {
      await ctx.answerCbQuery()

      throw new Error(
        `${error} 🏓`
      )
    }

    await ctx.answerCbQuery()

    await ctx.reply(
      `"${headword}" added successfully! 👍`
    )

    const syncAfter = await sync(endpoint)

    if (!syncAfter || syncAfter.error) {
      ctx.reply(
        `Sync not available for the time being. Please, run /sync a bit later`
      )
    }
  } catch (e) {
    console.error(e)

    return ctx.reply(e.message)
  }
}
