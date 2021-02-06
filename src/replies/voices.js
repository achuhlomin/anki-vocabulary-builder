import got from 'got'

export const replyVoices = async (ctx, {
  urlUK,
  urlUS,
  headword,
}) => {
  const pronUrl = urlUK ? urlUK : urlUS

  if (pronUrl) {
    const buffer = await got(pronUrl, {
      resolveBodyOnly: true,
      responseType: 'buffer',
    })
    
    await ctx.replyWithVoice({
      source: buffer,
    })
  }
}