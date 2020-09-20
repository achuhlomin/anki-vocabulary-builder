import jsdom from 'jsdom'

const { JSDOM } = jsdom

export const getInfo = async (term) => {
    const domain = 'dictionary.cambridge.org'
    const htmlUrl = `https://${domain}/dictionary/english/${term}`
    const dom = await JSDOM.fromURL(htmlUrl);
    const $entry = dom.window.document.querySelector('.entry')

    if (!$entry) {
        return null
    }

    const word = $entry.querySelector('.headword').textContent
    const def = $entry.querySelector('.def').textContent
    const part = $entry.querySelector('.posgram').textContent

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
        def,
        part,
        phonUK,
        phonUS,
        urlUK: `https://${domain}${urlUK}`,
        urlUS: `https://${domain}${urlUS}`,
        examples,
        synonyms,
    }
}