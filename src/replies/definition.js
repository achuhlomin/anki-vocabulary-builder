import Markup from 'telegraf/markup.js'

import {formatDefinition} from "../messages/index.js";

export const replyDefinitions = async (ctx, {definitions}) => {
  const { state } = ctx
  const { redisClient } = state

  for (let i = 1; i < definitions.length; i++) {
    const {
      headword,
      def,
      region,
      poses,
      gram,
      phonUK,
      phonUS,
    } = definitions[i]

    const definitionMsg = formatDefinition({
      headword,
      def,
      region,
      poses,
      gram,
      phon: phonUK ? phonUK : phonUS,
    })

    const buttons = [
      Markup.callbackButton('Add', 'add'),
    ]

    const extra = Markup.inlineKeyboard(buttons).extra({parse_mode: 'HTML'})
    const reply = await ctx.reply(definitionMsg, extra)

    const value = JSON.stringify({
      headword,
      offset: i,
    })

    redisClient.set(`message:${reply.message_id}`, value, 'EX', 60 * 60 * 24 * 30 * 12)
  }
}
