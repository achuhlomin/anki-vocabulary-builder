import Telegraf from 'telegraf'
import util from 'util'
import childProcess from 'child_process'
import Markup from 'telegraf/markup.js'
import {detect as bingDetect} from './src/translator/bing.js'
import {translate as googleTranslate} from './src/translator/google.js'
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
  andrewchuhlomin: {
    deckName: '8. Vocabulary Builder'
  },
}

bot.use(Telegraf.log())

const getConnect = async (ctx) => {
  const {username} = await ctx.getChat();
  const {stdout: ip} = await exec(`docker container inspect anki_${username} | jq '.[0].NetworkSettings.IPAddress' | sed 's/"//g' | tr -d '\n'`)

  if (!ip) {
    throw new Error(`Sorry! Your anki isn't registered.`)
  }

  const customMeta = anki[username]

  return {
    endpoint: `http://${ip}:8765`,
    deckName: customMeta && customMeta.deckName ? customMeta.deckName : 'Vocabulary Builder'
  }
}

const getTerm = async (text) => {
  const lang = await bingDetect(text)

  if (lang === 'en') {
    return text;
  }

  const translation = await googleTranslate(text, STUDENT_LANG, 'en')

  return translation.toLowerCase()
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

const formatWithPos = (info, attr) => {
  let chunks = [];

  Object.keys(info).forEach((pos) => {
    const items = info[pos][attr]

    if (items.length) {
      chunks.push(`${pos}: ${items.join(', ')}`)
    }
  })

  return chunks.join('. ')
}

const formatWithoutPos = (info, attr) => {
  let chunks = [];

  Object.keys(info).forEach((pos) => {
    const items = info[pos][attr]

    if (items.length) {
      chunks.push(items.join(', '))
    }
  })

  return chunks.join(', ')
}

const getDefinitionMsg = ({ headword, def, region, phon, pos, gram, hint }) => {
  const part = [pos, region, gram, hint].filter(i => i).join(' ')
  const _phon = phon ? ` ${phon}` : ''
  const _def = `${headword}${_phon} — ${def}. ${part}`

  return `${_def}`
}

const replyDefinitions = async (ctx, definitions, info) => {
  for(let i = 0; i < definitions.length; i++) {
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
      info,
    }
  }
}

const getInfoMsg = ({translations, meanings}) => {
  const _translations = translations && translations.length ? `<i>${translations}</i>` : ''
  const _meanings = meanings && meanings.length ? `\n\nSee also: ${meanings}` : ''

  return `${_translations}${_meanings}`
}

const replyPivot = async (ctx, definition, alternatives, info) => {
  const translations = formatWithPos(info, 'translations')
  const meanings = formatWithoutPos(info, 'meanings')

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
    translations,
    meanings,
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
    info,
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

    const term = await getTerm(ctx.message.text);
    const definitions = await cambridgeLookup(term);
    const [ definition, ...alternatives ] = definitions

    if (definition) {
      const {headword, urlUK, urlUS} = definition;
      const info = await yandexLookup(headword, 'en', STUDENT_LANG)

      await replyVoices(ctx, urlUK, urlUS)
      await replyPivot(ctx, definition, alternatives, info)
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

    const { alternatives, info } = data

    await replyDefinitions(ctx, alternatives.reverse(), info);
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
      info,
    } = data;

    const translations = formatWithPos(info, 'translations')
    const meanings = formatWithoutPos(info, 'meanings')

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
      translations,
      meanings,
    })

    if (error) {
      await ctx.answerCbQuery()

      throw new Error(
        `${error} 🏓`
      )
    }

    const syncAfter = await sync(endpoint)

    await ctx.answerCbQuery()

    await ctx.reply(
      `"${headword}" added successfully! 👍`
    )

    if (!syncAfter || syncAfter.error) {
      ctx.reply(
        `"${headword}" added successfully! But sync not available for the time being. Please, run /sync a bit later`
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

