const { promises: fs, existsSync: exists } = require('fs')
const path = require('path')

const fetch = require('node-fetch')
const { JSDOM } = require('jsdom')

const BASE_URL = 'https://bladmineerders.nl/backgrounds/specials/?lang=nl'
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
  const posts = dom.window.document.querySelectorAll('.news-article')

  for (const post of posts) {
    const scope = post.querySelector('.entry-title').textContent

    if (!scope.startsWith('gallers ')) continue

    const title = post.querySelector('h2:not(.entry-title)') ? post.querySelector('h2:not(.entry-title)').textContent : scope[0].toUpperCase() + scope.slice(1)
    const date = post.querySelector('.mod_date-container') ? post.querySelector('.mod_date-container').textContent.match(/(\d+)\.([xvi]+)\.(\d{4})/).slice(1, 4) : ''
    const url = post.querySelector('.entry-title a').getAttribute('href')
    const author = post.querySelector('.remark') ? [...post.querySelectorAll('.remark')].pop().textContent.replace(/^by /, '') : ''
    console.log(`${title}	${author}	${url}		online	${parseDate(...date)}			Bladmineerders Specials\t							en		key	${scope}		FALSE	`)
  }
}

const months = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii']

function parseDate (day, month, year) {
    return `${year}-${months.indexOf(month) + 1}-${day.padStart(2, '0')}`
}

main().catch(console.error)
