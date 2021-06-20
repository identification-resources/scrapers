const { promises: fs, existsSync: exists } = require('fs')
const path = require('path')

const fetch = require('node-fetch');

const BASE_URL = 'https://artfakta.se/api/keys/metadata'
const CACHE_FILE = path.join(__dirname, 'cache.json')

async function main () {
  let file
  if (exists(CACHE_FILE)) {
    console.error('Using cache...')
    file = await fs.readFile(CACHE_FILE, 'utf8')
  } else {
    console.error('Fetching over HTTP...')
    const response = await fetch(BASE_URL, { headers: { Accept: 'application/json' } })
    file = await response.text()
    await fs.writeFile(CACHE_FILE, file)
  }

  const keys = JSON.parse(file)

  for (const key of keys) {
    const title = `${key.keyName} (${key.keySubName})`
    const date = key.createdDate.split(' ')[0]
    const url = `https://artfakta.se/artbestamning/taxon/${key.routePath}/artnyckel?keyId=${key.keyId}`
    console.log(`${title}		${url}		online	${date}	ArtDatabanken	${key.keyDescription}	Artfakta Artnycklar\t							${key.keyLanguage}		key; matrix	${key.rootTaxonScientificName}	Europe, Sweden	TRUE	species`)
  }
}

main().catch(console.error)
