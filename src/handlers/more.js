import Markup from 'telegraf/markup.js'

import {replyDefinitions} from "../replies/index.js";

export const onMoreHandler = async (ctx) => {
  try {
    const { state } = ctx
    const { redisClient } = state
    const messageId = ctx.update.callback_query.message.message_id;
    const {headword} = JSON.parse(await redisClient.get(`message:${messageId}`))

    if (!headword) {
      await ctx.answerCbQuery()

      throw new Error(
        `Failure! Add persistent cache 💩`
      )
    }

    const {definitions, alternatives, translations} = JSON.parse(await redisClient.get(`headword:${headword}`))

    await ctx.editMessageReplyMarkup(Markup.inlineKeyboard([
        Markup.callbackButton('Add', 'add')
      ]
    ))

    await replyDefinitions(ctx, {
      definitions,
      alternatives,
      translations,
    });

    await ctx.answerCbQuery()
  } catch (e) {
    console.error(e)

    return ctx.reply(e.message)
  }
}
