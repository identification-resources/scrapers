const { promises: fs, existsSync: exists } = require('fs')
const path = require('path')

const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

const BASE_URL = 'http://www.entomologi.no/journals/tabell/tabell.htm'
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
  const rows = dom.window.document.querySelectorAll('body > table > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr:nth-child(5) > td > table > tbody > tr:nth-child(2) > td > table > tbody > tr > td')
 
  for (const row of rows) {
    const [number, _, authorYear] = row.querySelector('strong').childNodes
    const [author, year] = authorYear.textContent.match(/(\S.+) (\d{4})/).slice(1)

    const data = {
      title: row.childNodes[6].textContent.trim(),
      author,
      date: year,
      number: number.textContent.match(/\d+/)[0],
      url: (new URL(row.querySelector('a[href^=pdf]').href, BASE_URL)).href
    }
    
    console.log(`${data.title}	${data.author}	${data.url}		print	${data.date}	Norsk Entomologisk Forening		Norske Insekttabeller	1503-2108			${data.number}				nb		key		Europe, Norway	TRUE	species`)
  }
}

main().catch(console.error)
