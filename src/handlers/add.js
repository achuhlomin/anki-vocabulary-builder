import {getConnect} from "../helpers/index.js"

import {
  addNote,
  sync,
} from "../anki/index.js";

export const onAddHandler = async (ctx) => {
  try {
    const data = ctx.session[ctx.update.callback_query.message.message_id]

    if (!data) {
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

    const {
      headword,
      def,
      region,
      pos,
      gram,
      phonUK,
      phonUS,
      urlUK,
      urlUS,
      examples,
      alternatives,
      translations,
    } = data;

    const {error} = await addNote(endpoint, deckName, {
      headword,
      def,
      region,
      pos,
      gram,
      phonUK,
      phonUS,
      urlUK,
      urlUS,
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
