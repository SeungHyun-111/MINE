import { writeFile } from 'node:fs/promises'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const SOURCE_BASE = 'https://musclewiki.com'

const TARGETS = {
  traps: 'traps',
  sternocleidomastoid: 'neck',
  rhomboid: 'traps',
  chest: 'chest',
  deltoid_front: 'shoulders',
  biceps: 'biceps',
  brachialis: 'biceps',
  forearm_front: 'forearms',
  abs: 'abdominals',
  obliques: 'obliques',
  serratus: 'chest',
  rectus_femoris: 'quads',
  vastus_lateralis: 'quads',
  quad: 'quads',
  tibialis: 'calves',
  calf_front: 'calves',
  rear_deltoid: 'shoulders',
  triceps: 'triceps',
  lat: 'lats',
  erector_spinae: 'lowerback',
  glute: 'glutes',
  hamstring: 'hamstrings',
  calf_back: 'calves',
}

const headers = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36',
  accept: 'text/html,application/xhtml+xml',
}

const decodeHtml = (value) => value
  .replace(/&amp;/g, '&')
  .replace(/&#x27;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')

const stripTags = (value) => decodeHtml(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())

const fetchHtml = async (url) => {
  const response = await fetch(url, { headers })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`)
  return response.text()
}

const getTotalPages = (html) => {
  const match = html.match(/showing\s+\d+\s+to\s+\d+\s+of\s+([\d,]+)\s+Results/i)
  if (!match) {
    const totalCount = html.match(/\\"totalCount\\":(\d+)/)?.[1] ?? html.match(/"totalCount":(\d+)/)?.[1]
    return totalCount ? Math.ceil(Number(totalCount) / 4) : 1
  }
  return Math.ceil(Number(match[1].replace(/,/g, '')) / 4)
}

const parseExercises = (html) => {
  const matches = [...html.matchAll(/<a[^>]+href="(\/exercise\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]

  return matches
    .map((match) => {
      const url = `${SOURCE_BASE}${decodeHtml(match[1])}`
      const text = stripTags(match[2])
      const name = text.split(/\b(?:Beginner|Novice|Intermediate|Advanced)\b/)[0].trim()
      const difficulty = text.match(/\b(Beginner|Novice|Intermediate|Advanced)\b/)?.[1] ?? null
      return { name, difficulty, url }
    })
    .filter((exercise) => exercise.name && !exercise.name.includes('Image:'))
}

const uniqueByUrl = (items) => {
  const seen = new Set()
  return items.filter((item) => {
    if (seen.has(item.url)) return false
    seen.add(item.url)
    return true
  })
}

const scrapeSlug = async (slug) => {
  const firstUrl = `${SOURCE_BASE}/exercises/${slug}`
  const firstHtml = await fetchHtml(firstUrl)
  const totalPages = getTotalPages(firstHtml)
  const exercises = parseExercises(firstHtml)

  const pageUrls = Array.from({ length: totalPages - 1 }, (_, index) => `${firstUrl}/${index + 2}`)
  const pageHtml = await Promise.all(pageUrls.map((pageUrl) => fetchHtml(pageUrl)))
  pageHtml.forEach((html) => exercises.push(...parseExercises(html)))

  return {
    slug,
    sourceUrl: firstUrl,
    totalPages,
    exercises: uniqueByUrl(exercises),
  }
}

const uniqueSlugs = [...new Set(Object.values(TARGETS))]
const bySlug = Object.fromEntries(await Promise.all(uniqueSlugs.map(async (slug) => [slug, await scrapeSlug(slug)])))

const byMuscle = Object.fromEntries(
  Object.entries(TARGETS).map(([muscleId, slug]) => [
    muscleId,
    {
      slug,
      sourceUrl: bySlug[slug].sourceUrl,
      exercises: bySlug[slug].exercises,
    },
  ]),
)

await writeFile(
  new URL('../src/data/musclewikiExercises.json', import.meta.url),
  `${JSON.stringify({
    scrapedAt: new Date().toISOString(),
    source: SOURCE_BASE,
    byMuscle,
  }, null, 2)}\n`,
)

console.log(`Saved ${Object.keys(byMuscle).length} muscle mappings from ${uniqueSlugs.length} MuscleWiki pages.`)
