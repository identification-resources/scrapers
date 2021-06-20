const { promises: fs, existsSync: exists } = require('fs')
const path = require('path')

const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

const BASE_URL = `https://forum.waarneming.nl/index.php/topic,1463.0.html`
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
  const messages = dom.window.document.querySelectorAll('#forumposts > form > div.bordercolor')

  for (const message of messages) {
		const author = message.querySelector('.poster h4').textContent
		const info = message.querySelector('.postarea .keyinfo').textContent
		const number = info.match(/(?<=#)\d+/) || 0
		const [monthName, day, year] = info.match(/([a-z]+) (\d{2}), (\d{4})/).slice(1)
		const month = ['', 'jan', 'feb', 'maa', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
			.indexOf(monthName.slice(0, 3))
			.toString()
			.padStart(2, '0')
	  const time = info.match(/\d\d:\d\d:\d\d/)
		const id = message.children[0].getAttribute('id') || 0
		const url = `https://forum.waarneming.nl/index.php/topic,1463.${id}.html#${id}`
		console.log(`${number}\t${author}\t${year}-${month}-${day}\t${time}\t${url}`)
  }
}

main().catch(console.error)
