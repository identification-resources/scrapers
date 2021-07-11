const { promises: fs, existsSync: exists, createWriteStream } = require('fs')
const path = require('path')

const fetch = require('node-fetch')
const { JSDOM } = require('jsdom')

async function main (args) {
  if (args.length !== 2) {
    console.error(`Usage: node index.js <url> <directory>`)
    process.exit(1)
  }


  const [BASE_URL, directory] = args
  const CACHE_FILE = path.join(directory, 'index.html')

  if (!exists(directory)) {
    await fs.mkdir(directory, { recursive: true })
  }

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

  const SDD_FILE = path.join(directory, 'key.sdd.xml')
  let sdd
  if (exists(SDD_FILE)) {
    console.error('Using cache...')
    sdd = await fs.readFile(SDD_FILE, 'utf8')
  } else {
    console.error('Fetching over HTTP...')
    const sddUrl = file.match(/initMkey\('(.*?)'/)[1]
    const response = await fetch(sddUrl)
    sdd = await response.text()
    await fs.writeFile(SDD_FILE, sdd)
  }

  const dom = new JSDOM('')
  const parser = new dom.window.DOMParser
  const xml = parser.parseFromString(sdd, 'text/xml')

  const IMAGE_DIR = path.join(directory, 'images')
  if (!exists(IMAGE_DIR)) {
    await fs.mkdir(IMAGE_DIR, { recursive: true })
  }

  for (const image of xml.querySelectorAll('MediaObjects MediaObject')) {
    const id = image.getAttribute('id')
    const source = image.querySelector('Source').getAttribute('href')

    const extension = path.extname((new URL(source)).pathname)
    const file = createWriteStream(path.join(IMAGE_DIR, id + extension))
    const response = await fetch(source)
    response.body.pipe(file)
  }
}

main(process.argv.slice(2)).catch(console.error)
