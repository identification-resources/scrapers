const { promises: fs, existsSync: exists } = require('fs')
const path = require('path')

const fetch = require('node-fetch')
const Formica = require('@larsgw/formica')

const BASE_URL = 'https://artfakta.se/api/keys/'
const RESOURCES_BASE = path.join(__dirname, 'resources')

const CACHE_FILE = path.join(__dirname, 'cache.json')
let cache
async function fetchText (url, options) {
  if (!cache) {
    if (exists(CACHE_FILE)) {
      cache = JSON.parse(await fs.readFile(CACHE_FILE, 'utf8'))
    } else {
      cache = {}
    }
  }
  delete cache['https://identification-resources.github.io/assets/data/catalog.csv']

  if (cache.hasOwnProperty(url)) {
    // console.error('Using cache...')
  } else {
    console.error('Fetching over HTTP...')
    cache[url] = await fetch(url, options).then(response => response.text())
  }

  return cache[url]
}

async function getKeys (url) {
  const response = JSON.parse(await fetchText(url))
  const links = response.records ? response.records.flatMap(records => records.children) : response.children
  const keys = []
  for (const link of links) {
    if (link.type === 1) {
      keys.push(JSON.parse(await fetchText(BASE_URL + link.id)))
    } else if (link.type === 3) {
      keys.push(...await getKeys(BASE_URL + link.id))
    }
  }
  return keys
}

async function main () {
  const catalog = await fs.readFile('../../../catalog/catalog.csv', 'utf8').then(file => Formica.catalog.loadData(file, 'catalog'))
  const byArtnyckelId = {}
  for (const work of catalog) {
    if (work.has('fulltext_url')) {
      for (const url of work.get('fulltext_url')) {
        const match = url.match(/artnyckel(?:\?keyId=|\/)(\d+)$/)
        if (match) {
          byArtnyckelId[match[1]] = work.get('id')
        }
      }
    }
  }

  await fs.mkdir(RESOURCES_BASE, { recursive: true })

  const keys = await getKeys(BASE_URL)
  for (const key of keys) {
    const id = byArtnyckelId[key.id] || ''
    const title = `${key.name} (${key.subName})`
    const date = key.createdDate.split('T')[0]
    const url = `https://artfakta.se/artinformation/taxa/${key.taxonId}/artnyckel/${key.id}`
    console.log(`${id}	${title}		${url}	${url}		online	${date}	ArtDatabanken	${key.description}	Artfakta Artnycklar\t							se		key; matrix	${key.subName}	Europe, Sweden	TRUE	species`)

    const taxa = JSON.parse(await fetchText(BASE_URL + key.id + '/taxa'))
    await fs.writeFile(path.join(RESOURCES_BASE, id + '.txt'), taxa.items.map(item => item.scientificName || item.swedishName).join('\n'))
  }
}

main().catch(console.error).finally(() => {
  return fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2))
})
