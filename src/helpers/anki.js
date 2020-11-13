const anki = {
  369837507: {
    deckName: '8. Vocabulary Builder'
  },
}

export const getConnect = async (ctx) => {
  const {id} = await ctx.getChat();

  const customMeta = anki[id]

  return {
    endpoint: `http://anki-${id}:8765`,
    deckName: customMeta && customMeta.deckName ? customMeta.deckName : 'Vocabulary Builder'
  }
}