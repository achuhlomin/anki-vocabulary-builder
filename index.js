import util from 'util'
import childProcess from 'child_process'
import Telegraf from 'telegraf'
import redis from 'redis'
import asyncRedis from 'async-redis'

const exec = util.promisify(childProcess.exec)

import {
  onStartHandler,
  onHelpHandler,
  onSyncHandler,
  onTextHandler,
  onMoreHandler,
  onAddHandler,
} from './src/handlers/index.js'

const REDIS_CONTAINER_NAME = 'anki-vocabulary-redis'
const S3_BUCKET_NAME = 'anki-vocabulary-bucket';

const {
  BOT_TOKEN,
  YANDEX_TOKEN,
  STUDENT_LANG,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
} = process.env

const bot = new Telegraf(BOT_TOKEN)
const execRedisIp = `docker container inspect ${REDIS_CONTAINER_NAME} | jq '.[0].NetworkSettings.IPAddress' | sed 's/"//g' | tr -d '\n'`
const {stdout: redisIp} = await exec(execRedisIp)

const redisClient = asyncRedis.decorate(redis.createClient({
    host: redisIp,
    port: 6379,
  }
));

bot.use((ctx, next) => {
  ctx.state = {
    ...ctx.state,
    yandexToken: YANDEX_TOKEN,
    studentLang: STUDENT_LANG,
    s3BucketName: S3_BUCKET_NAME,
    awsAccessKeyId: AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: AWS_SECRET_ACCESS_KEY,
    redisClient,
  }

  return next()
})

bot.start(onStartHandler)
bot.help(onHelpHandler)
bot.command('sync', onSyncHandler)
bot.on('text', onTextHandler)
bot.action('more', onMoreHandler)
bot.action('add', onAddHandler)

await bot.launch()

