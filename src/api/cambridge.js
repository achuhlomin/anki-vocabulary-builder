import jsdom from 'jsdom'
import _ from 'lodash'

const {JSDOM} = jsdom

const cambridgeDomain = 'dictionary.cambridge.org'

const formatDef = (def, {headword}) => {
  return _.lowerFirst(def)
    .replace(/(\s*:\s*)$/, '')
    .replace(/\s+/g, ' ')
    .replace(new RegExp(`^${headword}|(?<=\\s)${headword}`, 'ig'), '..')
    .trim()
}

const getDom = async (term) => {
  try {
    const htmlUrl = `https://${cambridgeDomain}/search/english/direct/?q=${encodeURI(term)}`
    return await JSDOM.fromURL(htmlUrl)
  } catch (e) {
    return null
  }

}

const getDocument = async (term) => {
  const dom = await getDom(term)

  if (!dom) {
    return null;
  }

  if (dom.window.location.pathname.startsWith(`/dictionary/english/`)) {
    return dom.window.document
  }

  const newTerm = dom.window.document.querySelector('.x .lbt span')?.textContent

  if (!newTerm) {
    return null
  }

  const newDom = await getDom(newTerm)

  return newDom.window.document
}

export const lookup = async (term) => {
  const definitions = [];
  const document = await getDocument(term)

  if (!document) return definitions

  const headword = document.querySelector('.headword')?.textContent

  if (!headword) return definitions
  
  const $uk = document.querySelector('.uk')
  const urlUK = $uk?.querySelector(`source[type='audio/mpeg']`)?.getAttribute('src')
  const phonUK = $uk?.querySelector('.pron')?.textContent
  const $us = document.querySelector('.us')
  const urlUS = $us?.querySelector(`source[type='audio/mpeg']`)?.getAttribute('src')
  const phonUS = $us?.querySelector('.pron')?.textContent
  const $items = document.querySelectorAll('.pr.entry-body__el') || []
  const allExamples = [];

  for (let i = 0; i < $items.length; i++) {
    const $item = $items[i]
    const $blocks = $item.querySelectorAll('.def-block')
    const region = $item.querySelector('.region')?.textContent
    const gram = $item.querySelector('.dgram')?.textContent

    for (let j = 0; j < $blocks.length; j++) {
      const $block = $blocks[j]
      const def = $block.querySelector('.def')?.textContent
      
      if (!def) continue

      const $poses = $block.closest('.entry').querySelector('.pos-header').querySelectorAll('.pos')
      const poses = Array.prototype.map.call($poses, node => node.textContent)
      const $examples = $block.querySelectorAll('.examp')
      const examples = Array.prototype.map.call($examples, node => node.textContent)
      const example = examples[0];

      allExamples.push(...examples)

      definitions.push({
        headword,
        def: formatDef(def, {headword}),
        region: region !== 'uk' ? region : null,
        poses,
        gram,
        phonUK,
        phonUS,
        urlUK: urlUK ? `https://${cambridgeDomain}${urlUK}` : null,
        urlUS: urlUS ? `https://${cambridgeDomain}${urlUS}` : null,
        examples: example ? [example] : [],
      })
    }
  }

  definitions.forEach(definition => {
    definition.examples = _.union(definition.examples, allExamples)
  })

  return definitions
}