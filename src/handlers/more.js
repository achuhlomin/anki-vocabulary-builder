import Markup from 'telegraf/markup.js'

import {replyDefinitions} from "../replies/index.js";

export const onMoreHandler = async (ctx) => {
  try {
    const data = ctx.session[ctx.update.callback_query.message.message_id]

    if (!data) {
      await ctx.answerCbQuery()

      throw new Error(
        `Failure! Add persistent cache 💩`
      )
    }

    const {rest, alternatives, translations} = data

    await ctx.editMessageReplyMarkup(Markup.inlineKeyboard([
        Markup.callbackButton('Add', 'add')
      ]
    ))

    await replyDefinitions(ctx, {
      definitions: rest,
      alternatives,
      translations,
    });

    await ctx.answerCbQuery()
  } catch (e) {
    console.error(e)

    return ctx.reply(e.message)
  }
}
