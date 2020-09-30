import jsdom from 'jsdom'
import _ from 'lodash'

const {JSDOM} = jsdom

const CAMBRIDGE_DOMAIN = 'dictionary.cambridge.org'

const formatDef = (def, {word}) => {
  const formattedDef = def.trim().replace(/:$/, '').trim()

  if (formattedDef[0] === formattedDef[0].toUpperCase()) {
    return _.lowerFirst(formattedDef).replace(new RegExp(word, 'g'), '..')
  }

  return formattedDef
}

const getEntry = async (term) => {

  try {
    const htmlUrl = `https://${CAMBRIDGE_DOMAIN}/search/english/direct/?q=${encodeURI(term)}`
    const dom = await JSDOM.fromURL(htmlUrl)
    const $entry = dom.window.document.querySelector('.entry')

    return {
      $entry,
      dom,
    }
  } catch (e) {
    return null
  }

}

const getSafeEntry = async (term) => {
  const result = await getEntry(term)

  if (!result) {
    return null;
  }

  const {$entry, dom} = result;

  if ($entry) {
    return $entry
  }

  const newTerm = dom.window.document.querySelector('.x .lbt span')?.textContent

  if (!newTerm) {
    return null
  }

  const {$entry: $newEntry} = await getEntry(newTerm)

  return $newEntry
}

export const define = async (term) => {
  const $entry = await getSafeEntry(term)

  if (!$entry) {
    return null;
  }

  const word = $entry.querySelector('.headword').textContent
  const def = $entry.querySelector('.def').textContent
  const pos = $entry.querySelector('.pos')?.textContent
  const gram = $entry.querySelector('.gram')?.textContent
  const variant = $entry.querySelector('.var')?.textContent
  const part = [pos, gram, variant].filter(i => i).join(' ')

  const $uk = $entry.querySelector('.uk')
  const urlUK = $uk.querySelector(`source[type='audio/mpeg']`).getAttribute('src')
  const phonUK = $uk.querySelector('.pron').textContent

  const $us = $entry.querySelector('.us')
  const urlUS = $us.querySelector(`source[type='audio/mpeg']`).getAttribute('src')
  const phonUS = $us.querySelector('.pron').textContent

  const $examples = $entry.querySelectorAll('.examp')
  const examples = Array.prototype.map.call($examples, node => node.textContent)

  const $synonyms = $entry.querySelectorAll('.synonyms .item');
  const synonyms = Array.prototype.map.call($synonyms, node => node.textContent)

  return {
    word,
    def: formatDef(def, {word}),
    part,
    phonUK,
    phonUS,
    urlUK: `https://${CAMBRIDGE_DOMAIN}${urlUK}`,
    urlUS: `https://${CAMBRIDGE_DOMAIN}${urlUS}`,
    examples,
    synonyms,
  }
}