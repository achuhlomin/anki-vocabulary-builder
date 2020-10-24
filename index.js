import Telegraf from 'telegraf'
import util from 'util'
import childProcess from 'child_process'
import _ from 'lodash'
import Markup from 'telegraf/markup.js'
import {lookup as cambridgeLookup} from './src/translator/cambridge.js'
import {lookup as yandexLookup} from './src/translator/yandex.js'
import {addNote} from './src/anki/addNote.js'
import {sync} from './src/anki/sync.js'

const exec = util.promisify(childProcess.exec)

const BOT_TOKEN = process.env.BOT_TOKEN
const STUDENT_LANG = process.env.STUDENT_LANG

const bot = new Telegraf(BOT_TOKEN)
const cache = {};

const anki = {
  369837507: {
    deckName: '8. Vocabulary Builder'
  },
}

const getConnect = async (ctx) => {
  const {id} = await ctx.getChat();

  const {stdout: ip} = await exec(`docker container inspect anki_${id} | jq '.[0].NetworkSettings.IPAddress' | sed 's/"//g' | tr -d '\n'`)

  if (!ip) {
    throw new Error(`Sorry! Your anki isn't registered.`)
  }

  const customMeta = anki[id]

  return {
    endpoint: `http://${ip}:8765`,
    deckName: customMeta && customMeta.deckName ? customMeta.deckName : 'Vocabulary Builder'
  }
}

const getTerm = async (text) => {
  const lookup = await yandexLookup(text, STUDENT_LANG, 'en')
  const translations = lookup.translations.map(({term}) => term)

  if (translations.length) {
    return translations[0]
  }

  return text
}

const onStartHandler = (ctx) => {
  return ctx.reply('Welcome! Send me a word 🥳')
}

const onHelpHandler = (ctx) => {
  return ctx.reply('Send me a word that I will try to add to your anki 🙂')
}

const onSyncHandler = async (ctx) => {
  try {
    await ctx.replyWithChatAction('typing')

    const {endpoint} = await getConnect(ctx)
    const syncResp = await sync(endpoint)

    if (!syncResp || syncResp.error) {
      await ctx.answerCbQuery()

      throw new Error(
        `Failure! Sync not available, please try again later 🏓`
      )
    }

    return ctx.reply('Success! Anki synced 🥳')
  } catch (e) {
    console.error(e)

    return ctx.reply(e.message)
  }
}

const formatTranslations = (items, {pos}) => {
  const chunks = [];

  const groups = items.reduce((acc, {pos: itemPos, term}) => {
    if (acc[itemPos]) {
      acc[itemPos].push(term)
    } else {
      acc[itemPos] = [term]
    }

    return acc
  }, {})

  _.union([pos], Object.keys(groups)).forEach(pos => {
    const items = groups[pos]

    if (items?.length) {
      chunks.push(`${pos}: ${items.join(', ')}`)
    }
  })

  return chunks.join('\n')
}

const formatAlternatives = (alternatives) => {
  return alternatives.join(', ')
}

const getDefinitionMsg = ({headword, def, region, phon, pos, gram}) => {
  const part = [pos, region, gram].filter(i => i).join(' ')
  const _phon = phon ? ` ${phon}` : ''
  const _def = `${headword}${_phon} — ${def}. ${part}`

  return `${_def}`
}

const replyDefinitions = async (ctx, {definitions, alternatives, translations}) => {
  for (let i = 0; i < definitions.length; i++) {
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
    } = definitions[i]

    const definitionMsg = getDefinitionMsg({
      headword,
      def,
      region,
      pos,
      gram,
      phon: phonUK ? phonUK : phonUS,
    })

    const buttons = [
      Markup.callbackButton('Add', 'add'),
    ]

    const extra = Markup.inlineKeyboard(buttons).extra({parse_mode: 'HTML'})
    const reply = await ctx.reply(definitionMsg, extra)

    cache[reply.message_id] = {
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
    }
  }
}

const getInfoMsg = ({translations, alternatives}) => {
  const _translations = translations && translations.length ? `<i>${translations}</i>` : ''
  const _alternatives = alternatives && alternatives.length ? `\n\nSee also: ${alternatives}` : ''

  return `${_translations}${_alternatives}`
}

const replyPivot = async (ctx, data) => {
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
    pos,
    gram,
    phonUK,
    phonUS,
    urlUK,
    urlUS,
    examples,
  } = definition

  const definitionMsg = getDefinitionMsg({
    headword,
    def,
    region,
    pos,
    gram,
    phon: phonUK ? phonUK : phonUS,
  })

  const infoMsg = getInfoMsg({
    alternatives: formatAlternatives(alternatives),
    translations: formatTranslations(translations, {pos}),
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

  cache[reply.message_id] = {
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
    rest,
  }
}

const replyVoices = async (ctx, urlUK, urlUS) => {
  const pronUrl = urlUK ? urlUK : urlUS

  if (pronUrl) {
    await ctx.replyWithVoice({filename: pronUrl, url: pronUrl})
  }
}

const onMessageHandler = async (ctx) => {
  try {
    await ctx.replyWithChatAction('typing')

    const term = await getTerm(ctx.message.text)
    const definitions = await cambridgeLookup(term)
    const [definition, ...rest] = definitions

    if (definition) {
      const {headword, urlUK, urlUS} = definition;
      const {alternatives, translations} = await yandexLookup(headword, 'en', STUDENT_LANG, false)

      await replyVoices(ctx, urlUK, urlUS)

      await replyPivot(ctx, {
        definition,
        rest,
        alternatives,
        translations,
      })
    } else {
      await ctx.reply(`"${term}" isn't found. Check availability of this one in "Cambridge Dictionary" 🤷🏼‍♀️`)
    }
  } catch (e) {
    console.error(e)

    return ctx.reply(e.message)
  }
}

const onMoreHandler = async (ctx) => {
  try {
    const data = cache[ctx.update.callback_query.message.message_id]

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

const onAddHandler = async (ctx) => {
  try {
    const data = cache[ctx.update.callback_query.message.message_id]

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
        `"But sync not available for the time being. Please, run /sync a bit later`
      )
    }
  } catch (e) {
    console.error(e)

    return ctx.reply(e.message)
  }
}

bot.start(onStartHandler)
bot.help(onHelpHandler)
bot.command('sync', onSyncHandler)
bot.on('message', onMessageHandler)
bot.action('more', onMoreHandler)
bot.action('add', onAddHandler)

await bot.launch()

