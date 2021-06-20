const { promises: fs, existsSync: exists } = require('fs')
const path = require('path')

const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

const MSG_ID = '17241'
const BASE_URL = `https://forum.waarneming.nl/index.php/topic,1463.msg${MSG_ID}.html`
const CACHE_FILE = path.join(__dirname, 'cache.html')

async function main () {
  let file
  if (exists(CACHE_FILE)) {
    console.error('Using cache...')
    file = await fs.readFile(CACHE_FILE, 'utf8')
  } else {
    console.error('Fetching over HTTP...')
    const response = await fetch(BASE_URL)
    file = await response.text()
    await fs.writeFile(CACHE_FILE, file)
  }

  const dom = new JSDOM(file)
  const text = dom.window.document.querySelector(`#msg_${MSG_ID}`).childNodes
  let header = null
  let url = null
  let desc = ''

  for (const part of text) {
    if (part.tagName === 'STRONG') header = part.textContent
    if (part.textContent === '-') header = null
    if (!header) continue

    if (part.tagName === 'UL') {
      for (const item of part.children) {
      	const url = item.querySelector('a').getAttribute('href')
				console.log(`${header}\t${item.textContent}\t${url}`)
      }
      continue
    }

    if (part.tagName === 'A') {
      url = part.getAttribute('href')
    }

    if (!url) continue

    if (part.tagName === 'BR') {
      console.log(`${header}\t${desc}\t${url}`)
      url = null
      desc = ''
    }

    desc += part.textContent
  }
}

main().catch(console.error)
