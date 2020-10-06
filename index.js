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

const formatMeanings = (meanings) => {
  return meanings.join(', ')
}

const getDefinitionMsg = ({headword, def, region, phon, pos, gram, hint}) => {
  const part = [pos, region, gram].filter(i => i).join(' ')
  const _phon = phon ? ` ${phon}` : ''
  const _def = `${headword}${_phon} — ${def}. ${part}`

  return `${_def}`
}

const replyDefinitions = async (ctx, {definitions, meanings, translations}) => {
  for (let i = 0; i < definitions.length; i++) {
    const {
      headword,
      def,
      region,
      pos,
      gram,
      hint,
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
      hint,
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
      hint,
      phonUK,
      phonUS,
      urlUK,
      urlUS,
      examples,
      meanings,
      translations,
    }
  }
}

const getInfoMsg = ({translations, meanings}) => {
  const _translations = translations && translations.length ? `<i>${translations}</i>` : ''
  const _meanings = meanings && meanings.length ? `\n\nSee also: ${meanings}` : ''

  return `${_translations}${_meanings}`
}

const replyPivot = async (ctx, data) => {
  const {
    definition,
    alternatives,
    meanings,
    translations,
  } = data;

  const {
    headword,
    def,
    region,
    pos,
    gram,
    hint,
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
    hint,
    phon: phonUK ? phonUK : phonUS,
  })

  const infoMsg = getInfoMsg({
    meanings: formatMeanings(meanings),
    translations: formatTranslations(translations, {pos}),
  });

  const pivotMsg = `${definitionMsg}\n\n${infoMsg}`

  const buttons = [
    Markup.callbackButton('Add', 'add'),
  ]

  if (alternatives.length) {
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
    hint,
    phonUK,
    phonUS,
    urlUK,
    urlUS,
    examples,
    meanings,
    translations,
    alternatives,
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
    const [definition, ...alternatives] = definitions

    if (definition) {
      const {headword, urlUK, urlUS} = definition;
      const {meanings, translations} = await yandexLookup(headword, 'en', STUDENT_LANG)

      await replyVoices(ctx, urlUK, urlUS)

      await replyPivot(ctx, {
        definition,
        alternatives,
        meanings,
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

    const {alternatives, meanings, translations} = data

    await ctx.editMessageReplyMarkup(Markup.inlineKeyboard([
        Markup.callbackButton('Add', 'add')
      ]
    ))

    await replyDefinitions(ctx, {
      definitions: alternatives,
      meanings,
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
      hint,
      phonUK,
      phonUS,
      urlUK,
      urlUS,
      examples,
      meanings,
      translations,
    } = data;

    const {error} = await addNote(endpoint, deckName, {
      headword,
      def,
      region,
      pos,
      gram,
      hint,
      phonUK,
      phonUS,
      urlUK,
      urlUS,
      examples,
      meanings,
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

    // Object.entries(cache).forEach(([key, value]) => {
    //   if (value.headword === headword) {
    //     ctx.telegram.editMessageReplyMarkup(
    //       ctx.update.callback_query.message.chat.id,
    //       key,
    //       undefined,
    //       JSON.stringify({inline_keyboard: []}),
    //     )
    //   }
    // })

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

bot.use(Telegraf.log())
bot.start(onStartHandler)
bot.help(onHelpHandler)
bot.command('sync', onSyncHandler)
bot.on('message', onMessageHandler)
bot.action('more', onMoreHandler)
bot.action('add', onAddHandler)

await bot.launch()

