import util from 'util'
import childProcess from 'child_process'

const exec = util.promisify(childProcess.exec)

const anki = {
  369837507: {
    deckName: '8. Vocabulary Builder'
  },
}

export const getConnect = async (ctx) => {
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