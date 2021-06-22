const { promises: fs, existsSync: exists } = require('fs')
const path = require('path')

const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

const BASE_URL = 'https://wildebloemen.info/pages%20sleutels/sleutels.php'
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
  const keys = dom.window.document.querySelectorAll('body > table:nth-child(8) td')

  for (const key of keys) {
    const title = key.querySelector('center').textContent.trim().replace(/\s+/g, ' ')
    const [taxon] = title.match(/(?<=\().*(?=\))/) || ['']
    const url = (new URL(key.querySelector('a').getAttribute('href'), BASE_URL)).href
    console.log(`${title}	Lidy Poot	${url}		online												nl-NL	<CC-BY-NC?>	key	${taxon}	Europe, Netherlands	FALSE	species`)
  }
}

main().catch(console.error)
