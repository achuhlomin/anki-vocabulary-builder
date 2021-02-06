import got from 'got'

export const replyVoices = async (ctx, {
  urlUK,
  urlUS,
  headword,
}) => {
  const pronUrl = urlUK ? urlUK : urlUS

  if (pronUrl) {
    // TODO :: Persist voices in s3
    // TODO :: Cache s3 links
    // TODO :: Use s3 links in anki
    const buffer = await got(pronUrl, {
      resolveBodyOnly: true,
      responseType: 'buffer',
    })
    
    await ctx.replyWithVoice({
      source: buffer,
    })
  }
}