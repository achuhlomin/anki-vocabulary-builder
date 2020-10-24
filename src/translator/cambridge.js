import jsdom from 'jsdom'
import _ from 'lodash'

const {JSDOM} = jsdom

const cambridgeDomain = 'dictionary.cambridge.org'

const formatDef = (def, {headword}) => {
  return _.lowerFirst(def)
    .replace(/(\s*:\s*)$/, '')
    .replace(/\s+/g, ' ')
    .replace(new RegExp(`^${headword}`, 'g'), '..')
    .trim()
}

const getEntries = async (term) => {

  try {
    const htmlUrl = `https://${cambridgeDomain}/search/english/direct/?q=${encodeURI(term)}`
    const dom = await JSDOM.fromURL(htmlUrl)
    const entries = dom.window.document.querySelectorAll('.entry')

    return {
      entries,
      dom,
    }
  } catch (e) {
    return null
  }

}

const getSafeEntries = async (term) => {
  const result = await getEntries(term)

  if (!result) {
    return [];
  }

  const {entries, dom} = result;

  if (entries.length) {
    return entries
  }

  const newTerm = dom.window.document.querySelector('.x .lbt span')?.textContent

  if (!newTerm) {
    return null
  }

  const newResult = await getEntries(newTerm)

  if (!newResult) {
    return []
  }

  return newResult.entries
}

export const lookup = async (term) => {
  const entries = await getSafeEntries(term)
  const definitions = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const headword = entry.querySelector('.headword').textContent
    const pos = entry.querySelector('.pos')?.textContent

    if (!pos) continue

    const region = entry.querySelector('.region')?.textContent
    const $uk = entry.querySelector('.uk')
    const urlUK = $uk?.querySelector(`source[type='audio/mpeg']`)?.getAttribute('src')
    const phonUK = $uk?.querySelector('.pron')?.textContent
    const $us = entry.querySelector('.us')
    const urlUS = $us?.querySelector(`source[type='audio/mpeg']`)?.getAttribute('src')
    const phonUS = $us?.querySelector('.pron')?.textContent
    const items = entry.querySelectorAll('.pr.dsense') || []

    for (let j = 0; j < items.length; j++) {
      const item = items[j]
      const def = item.querySelector('.def').textContent
      const gram = item.querySelector('.dgram')?.textContent
      const $examples = item.querySelectorAll('.examp')
      const examples = Array.prototype.map.call($examples, node => node.textContent)

      definitions.push({
        headword,
        def: formatDef(def, {headword}),
        region,
        pos,
        gram,
        phonUK,
        phonUS,
        urlUK: urlUK ? `https://${cambridgeDomain}${urlUK}` : null,
        urlUS: urlUS ? `https://${cambridgeDomain}${urlUS}` : null,
        examples,
      })
    }
  }

  return definitions
}