import jsdom from 'jsdom'
import _ from 'lodash'

const { JSDOM } = jsdom

const formatDef = (def, { word }) => {
    const formattedDef = def.trim().replace(/:$/, '').trim()

    if (formattedDef[0] === formattedDef[0].toUpperCase()) {
        return _.lowerFirst(formattedDef).replace(new RegExp(word, 'g'), '..')
    }

    return formattedDef
}

export const getDefinition = async (term) => {
    const domain = 'dictionary.cambridge.org'
    const htmlUrl = `https://${domain}/dictionary/english/${encodeURI(term)}`
    const dom = await JSDOM.fromURL(htmlUrl);
    const $entry = dom.window.document.querySelector('.entry')

    if (!$entry) {
        return null
    }

    const word = $entry.querySelector('.headword').textContent
    const def = $entry.querySelector('.def').textContent
    const pos = $entry.querySelector('.pos')?.textContent
    const region = $entry.querySelector('.region')?.textContent
    const variant = $entry.querySelector('.var')?.textContent
    const part = [pos, region, variant].filter(i => i).join(' ').toLowerCase()

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
        def: formatDef(def, { word }),
        part,
        phonUK,
        phonUS,
        urlUK: `https://${domain}${urlUK}`,
        urlUS: `https://${domain}${urlUS}`,
        examples,
        synonyms,
    }
}