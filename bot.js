import Telegraf from 'telegraf'
import util from 'util'
import childProcess from 'child_process'
import _ from 'lodash'
import Markup from 'telegraf/markup.js'
import {translate as bingTranslate} from './src/translator/bing.js'
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
  const translation = await bingTranslate(text, STUDENT_LANG, 'en')

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

const getDefinitionMsg = ({ term, def, region, phon, translations, meanings, pos, gram, hint }) => {
  const part = [pos, region, gram, hint].filter(i => i).join(' ')
  const _phon = phon ? ` ${phon}` : ''
  const _def = `${term}${_phon} — ${def}. ${part}`
  const _meanings = meanings && meanings.length ? `\n\nSee also: ${meanings.join(', ')}` : ''
  const _translations = `\n\n<i>${translations.join(', ')}</i>`

  return `${_def}${_translations}${_meanings}`
}

const handleMessage = async (ctx, next) => {
  await ctx.replyWithChatAction('typing')

  const term = next ? next.term : await getTerm(ctx.message.text);
  const newPosition = next ? next.position : [0, 0];
  const cambridgeResult = await cambridgeLookup(term, newPosition);

  if (!cambridgeResult) return ctx.reply(`"${term}" isn't found. Check availability of this one in "Cambridge Dictionary" 🤷🏼‍♀️`)

  const {data: cambridgeData, position} = cambridgeResult

  const {
    term: cambridgeTerm,
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
  } = cambridgeData

  const yandexData = await yandexLookup(cambridgeTerm, 'en', STUDENT_LANG)
  const yandexPoses = yandexData[pos] ? [pos] : Object.keys(yandexData)
  const yandexMeanings = []
  const yandexTranslations = []

  yandexPoses.forEach((yandexPos) => {
    const yandexDataByPos = yandexData[yandexPos];
    yandexMeanings.push(...yandexDataByPos.meanings)
    yandexTranslations.push(...yandexDataByPos.translations)
  })

  const meanings = _.union(_.without(yandexMeanings, cambridgeTerm))
  const translations = _.union(_.without(yandexTranslations, cambridgeTerm))
  const pronUrl = urlUK ? urlUK : urlUS

  if (pronUrl) {
    await ctx.replyWithVoice({filename: pronUrl, url: pronUrl})
  }

  const definitionMsg = getDefinitionMsg({
    term: cambridgeTerm,
    def,
    region,
    pos,
    gram,
    hint,
    phon: phonUK ? phonUK : phonUS,
    translations: yandexTranslations,
    meanings,
  })

  const buttons = [
    Markup.callbackButton('Add', 'add'),
  ]

  if (position) {
    buttons.push(Markup.callbackButton('Next', 'next'))
  }

  const extra = Markup.inlineKeyboard(buttons).extra({parse_mode: 'HTML'})

  const result = await ctx.reply(definitionMsg, extra)

  cache[result.message_id] = {
    term: cambridgeTerm,
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
    position,
  }
}

const onMessageHandler = async (ctx) => {
  try {
    await handleMessage(ctx)
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

    const {error} = await addNote(endpoint, deckName, data)

    if (error) {
      await ctx.answerCbQuery()

      throw new Error(
        `${error} 🏓`
      )
    }

    const syncAfter = await sync(endpoint)

    await ctx.answerCbQuery()

    const { term } = data;

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

const onNextHandler = async (ctx) => {
  try {
    const data = cache[ctx.update.callback_query.message.message_id]

    if (!data) {
      await ctx.answerCbQuery()

      throw new Error(
        `Failure! Add persistent cache 💩`
      )
    }

    const { term, position } = data;

    await handleMessage(ctx, { term, position })
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
bot.action('next', onNextHandler)

await bot.launch()

