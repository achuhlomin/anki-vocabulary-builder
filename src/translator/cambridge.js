import jsdom from 'jsdom'
import _ from 'lodash'

const {JSDOM} = jsdom

const cambridgeDomain = 'dictionary.cambridge.org'

const formatDef = (def, {word}) => {
  const formattedDef = def.trim().replace(/:$/, '').trim()

  if (formattedDef[0] === formattedDef[0].toUpperCase()) {
    return _.lowerFirst(formattedDef).replace(new RegExp(word, 'g'), '..')
  }

  return formattedDef
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

export const lookup = async (term, [ entryPosition, itemPosition ]) => {
  const definitions = [];
  const entries = await getSafeEntries(term)
  const entry = entries[Math.min(entryPosition, entries.length)]

  if (!entry) {
    return null;
  }

  const items = entry.querySelectorAll('.pr.dsense')
  const item = items[Math.min(itemPosition, items.length)]

  if (!item) {
    return null;
  }

  const word = entry.querySelector('.headword').textContent
  const pos = entry.querySelector('.pos').textContent
  const hint = entry.querySelector('.var')?.textContent
  const region = entry.querySelector('.region')?.textContent

  const $uk = entry.querySelector('.uk')
  const urlUK = $uk?.querySelector(`source[type='audio/mpeg']`).getAttribute('src')
  const phonUK = $uk?.querySelector('.pron')?.textContent

  const $us = entry.querySelector('.us')
  const urlUS = $us?.querySelector(`source[type='audio/mpeg']`).getAttribute('src')
  const phonUS = $us?.querySelector('.pron')?.textContent

  const def = item.querySelector('.def').textContent
  const gram = item.querySelector('.dgram')?.textContent

  const $examples = item.querySelectorAll('.examp')
  const examples = Array.prototype.map.call($examples, node => node.textContent)

  const nextAvailable = entryPosition + 1 < entries.length || itemPosition + 1< items.length

  let nextEntry = entryPosition
  let nextItem = itemPosition

  if (itemPosition + 1 === items.length && entryPosition + 1 < entries.length) {
    nextEntry = entryPosition + 1
    nextItem = 0
  } else if (itemPosition + 1 < items.length) {
    nextItem = itemPosition + 1
  }

  return {
    position: nextAvailable ? [nextEntry, nextItem] : false,
    data: {
      term: word,
      def: formatDef(def, {word}),
      region,
      pos,
      gram,
      hint,
      phonUK,
      phonUS,
      urlUK: urlUK ? `https://${cambridgeDomain}${urlUK}` : null,
      urlUS: urlUS ? `https://${cambridgeDomain}${urlUS}`: null,
      examples,
    },
  }
}