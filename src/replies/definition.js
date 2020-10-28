import Markup from 'telegraf/markup.js'

import {formatDefinition} from "../messages/index.js";

export const replyDefinitions = async (ctx, {definitions, alternatives, translations}) => {
  for (let i = 0; i < definitions.length; i++) {
    const {
      headword,
      def,
      region,
      poses,
      gram,
      phonUK,
      phonUS,
      urlUK,
      urlUS,
      examples,
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

    ctx.session[reply.message_id] = {
      headword,
      def,
      region,
      poses,
      gram,
      phonUK,
      phonUS,
      urlUK,
      urlUS,
      examples,
      alternatives,
      translations,
    }
  }
}
