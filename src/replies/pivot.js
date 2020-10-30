import Markup from 'telegraf/markup.js'

import {
  formatDefinition,
  formatInfo,
  formatAlternatives,
  formatTranslations,
} from "../messages/index.js";

export const replyPivot = async (ctx, data) => {
  const {
    definition,
    rest,
    alternatives,
    translations,
  } = data;

  const {
    headword,
    def,
    region,
    poses,
    gram,
    phonUK,
    phonUS,
  } = definition

  const definitionMsg = formatDefinition({
    headword,
    def,
    region,
    poses,
    gram,
    phon: phonUK ? phonUK : phonUS,
  })

  const infoMsg = formatInfo({
    alternatives: formatAlternatives(alternatives),
    translations: formatTranslations({translations, poses}),
  });

  const pivotMsg = `${definitionMsg}\n\n${infoMsg}`

  const buttons = [
    Markup.callbackButton('Add', 'add'),
  ]

  if (rest.length) {
    buttons.push(Markup.callbackButton('More', 'more'))
  }

  const extra = Markup.inlineKeyboard(buttons).extra({parse_mode: 'HTML'})
  const reply = await ctx.reply(pivotMsg, extra)

  console.log('reply.message_id', reply.message_id, headword)

  return reply.message_id
}
