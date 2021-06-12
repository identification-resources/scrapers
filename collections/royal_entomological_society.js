const { promises: fs, existsSync: exists } = require('fs')
const path = require('path')

const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

const BASE_URL = 'https://en.wikipedia.org/wiki/Royal_Entomological_Society_Handbooks'
const CACHE_FILE = path.join(__dirname, 'royal_entomological_society.html')

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
  const tables = dom.window.document.querySelectorAll('#mw-content-text > div.mw-parser-output > h2:nth-child(3) ~ .wikitable')

  for (const table of tables) {
    const rows = table.querySelectorAll('tr ~ tr')
    for (const row of rows) {
      let [title, edition, volumePart, date, authors, pages] = [...row.children].map(node => node.textContent.trim())
      let [volume, part] = volumePart.replace(/^Vol /, '').split(' Pt ')

      edition = edition.replace(/\D*$/, '')
      authors = authors.split(/; | & /g).map(author => author.split(', ').reverse().join(' ').replace(/\. ?/g, ' ')).join('; ')
      pages = pages.split(/, /).pop()

      const url = `https://www.royensoc.co.uk/sites/default/files/Vol${volume.replace(/^(?=\d(\D|$))/, '0')}_Part${part.replace(/^(?=\d(\D|$))/, '0').replace(/(?=i)/, '_').replace(/-/g, '+')}.pdf`

      console.log(`${title}	${authors}	${url}		print	${date}	Royal Entomological Society		Handbooks for the Identification of British Insects	0962-5852			${volume}	${part}	${pages}	${edition}	en-UK	CC-BY-NC-SA 2.0 UK	key		Europe, UK	TRUE	species`)
    }
  }
}

main().catch(console.error)
