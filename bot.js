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

const getDefinitionMsg = ({ headword, def, region, phon, pos, gram, hint }) => {
  const part = [pos, region, gram, hint].filter(i => i).join(' ')
  const _phon = phon ? ` ${phon}` : ''
  const _def = `${headword}${_phon} — ${def}. ${part}`

  return `${_def}`
}

const replyDefinitions = async (ctx, definitions, more) => {
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
      more,
    }
  }
}

const formatWithPos = (more, attr) => {
  let chunks = [];

  Object.keys(more).forEach((pos) => {
    const items = more[pos][attr]

    if (items.length) {
      chunks.push(`${pos}: ${items.join(', ')}`)
    }
  })

  return chunks.join('. ')
}

const formatWithoutPos = (more, attr) => {
  let chunks = [];

  Object.keys(more).forEach((pos) => {
    const items = more[pos][attr]

    if (items.length) {
      chunks.push(items.join(', '))
    }
  })

  return chunks.join(', ')
}

const getMoreMsg = ({translations, meanings}) => {
  const _translations = translations && translations.length ? `<i>${translations}</i>` : ''
  const _meanings = meanings && meanings.length ? `\n\nSee also: ${meanings}` : ''

  return `${_translations}${_meanings}`
}

const replyMore = async (ctx, more) => {
  const translations = formatWithPos(more, 'translations')
  const meanings = formatWithoutPos(more, 'meanings')

  const moreMsg = getMoreMsg({
    translations,
    meanings,
  });

  await ctx.reply(moreMsg, {parse_mode: 'HTML'})
}

const replyVoices = async (ctx, urlUK, urlUS) => {
  if (urlUK) {
    await ctx.replyWithVoice({filename: urlUK, url: urlUK})
  }

  if (urlUS) {
    await ctx.replyWithVoice({filename: urlUS, url: urlUS})
  }
}

const onMessageHandler = async (ctx) => {
  try {
    await ctx.replyWithChatAction('typing')

    const term = await getTerm(ctx.message.text);
    const definitions = await cambridgeLookup(term);
    const definition = definitions[0]

    if (definition) {
      const {headword, urlUK, urlUS} = definition;
      const more = await yandexLookup(headword, 'en', STUDENT_LANG)

      await replyDefinitions(ctx, definitions.reverse(), more);
      await replyVoices(ctx, urlUK, urlUS)
      await replyMore(ctx, more)
    } else {
      await ctx.reply(`"${term}" isn't found. Check availability of this one in "Cambridge Dictionary" 🤷🏼‍♀️`)
    }
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
      more,
    } = data;

    const translations = formatWithPos(more, 'translations')
    const meanings = formatWithoutPos(more, 'meanings')

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
      `"${term}" added successfully! 👍`
    )

    if (!syncAfter || syncAfter.error) {
      ctx.reply(
        `"${term}" added successfully! But sync not available for the time being. Please, run /sync a bit later`
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
bot.action('add', onAddHandler)

await bot.launch()

