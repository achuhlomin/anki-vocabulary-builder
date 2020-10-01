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

const getEntry = async (term) => {

  try {
    const htmlUrl = `https://${cambridgeDomain}/search/english/direct/?q=${encodeURI(term)}`
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

  const newResult = await getEntry(newTerm)

  if (!newResult || newResult.$entry) {
    return null
  }

  return newResult.$entry
}

export const lookup = async (term) => {
  const $entry = await getSafeEntry(term)

  if (!$entry) {
    return null;
  }

  const word = $entry.querySelector('.headword').textContent
  const def = $entry.querySelector('.def').textContent
  const region = $entry.querySelector('.region')?.textContent
  const pos = $entry.querySelector('.pos').textContent
  const gram = $entry.querySelector('.gram')?.textContent
  const hint = $entry.querySelector('.var')?.textContent

  const $uk = $entry.querySelector('.uk')
  const urlUK = $uk?.querySelector(`source[type='audio/mpeg']`).getAttribute('src')
  const phonUK = $uk?.querySelector('.pron')?.textContent

  const $us = $entry.querySelector('.us')
  const urlUS = $us?.querySelector(`source[type='audio/mpeg']`).getAttribute('src')
  const phonUS = $us?.querySelector('.pron')?.textContent

  const $examples = $entry.querySelectorAll('.examp')
  const examples = Array.prototype.map.call($examples, node => node.textContent)

  return {
    [pos]: {
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
    }
  }
}