import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const SOURCE_IMAGE_RE = /\.(png|jpe?g)$/i
const PUBLIC_IMAGE_RE = /\.(png|jpe?g|webp)$/i
const DEFAULT_MIN_SAVING = 0.92
const DEFAULT_RESIZE_RULES = [
  {
    test: /(?:^|[/\\])liquid-\d+.*\.(?:png|jpe?g|webp)$/i,
    maxWidth: 1200,
    maxHeight: 1800,
  },
]

function toBuffer(source) {
  return Buffer.isBuffer(source) ? source : Buffer.from(source)
}

function webpName(fileName) {
  return fileName.replace(/\.(png|jpe?g)$/i, '.webp')
}

function encodedFileName(fileName) {
  return fileName.split('/').map(encodeURIComponent).join('/')
}

function optimizeForOriginalFormat(filePath, input) {
  const ext = path.extname(filePath).toLowerCase()
  const image = sharp(input, { animated: true })

  if (ext === '.png') {
    return image.png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: true,
    }).toBuffer()
  }

  if (ext === '.jpg' || ext === '.jpeg') {
    return image.jpeg({
      quality: 82,
      progressive: true,
      mozjpeg: true,
    }).toBuffer()
  }

  return image.webp({
    quality: 82,
    effort: 4,
  }).toBuffer()
}

async function prepareInput(filePath, input, resizeRules) {
  const normalized = filePath.replaceAll('\\', '/')
  const rule = resizeRules.find((item) => item.test.test(normalized))

  if (!rule) return input

  return sharp(input, { animated: true })
    .resize({
      width: rule.maxWidth,
      height: rule.maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toBuffer()
}

async function maybeWriteSmaller(filePath, output) {
  const input = await fs.readFile(filePath)

  if (output.length < input.length) {
    await fs.writeFile(filePath, output)
  }
}

async function walkFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const filePath = path.join(dir, entry.name)
    return entry.isDirectory() ? walkFiles(filePath) : filePath
  }))

  return files.flat()
}

async function optimizeCopiedPublicImages(outDir, minSaving, resizeRules) {
  const files = await walkFiles(outDir)
  const images = files.filter((file) => PUBLIC_IMAGE_RE.test(file))

  await Promise.all(images.map(async (filePath) => {
    const input = await fs.readFile(filePath)
    const prepared = await prepareInput(filePath, input, resizeRules)
    const optimized = await optimizeForOriginalFormat(filePath, prepared)
    await maybeWriteSmaller(filePath, optimized)

    if (!SOURCE_IMAGE_RE.test(filePath)) return

    const webpPath = webpName(filePath)
    const webp = await sharp(prepared, { animated: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer()

    if (webp.length < input.length * minSaving) {
      await fs.writeFile(webpPath, webp)
    }
  }))
}

export default function imageOptimizer(options = {}) {
  const minSaving = options.minSaving ?? DEFAULT_MIN_SAVING
  const resizeRules = options.resizeRules ?? DEFAULT_RESIZE_RULES
  let outDir = 'dist'

  return {
    name: 'mine-image-optimizer',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    async generateBundle(_, bundle) {
      const replacements = []

      await Promise.all(Object.values(bundle).map(async (item) => {
        if (item.type !== 'asset' || !SOURCE_IMAGE_RE.test(item.fileName)) return

        const input = toBuffer(item.source)
        const prepared = await prepareInput(item.fileName, input, resizeRules)
        const webp = await sharp(prepared, { animated: true })
          .webp({ quality: 82, effort: 4 })
          .toBuffer()

        if (webp.length >= input.length * minSaving) return

        const previousFileName = item.fileName
        const nextFileName = webpName(previousFileName)

        item.fileName = nextFileName
        item.source = webp
        replacements.push([previousFileName, nextFileName])
        replacements.push([encodedFileName(previousFileName), encodedFileName(nextFileName)])
      }))

      if (replacements.length === 0) return

      Object.values(bundle).forEach((item) => {
        if (item.type !== 'chunk') return

        replacements.forEach(([from, to]) => {
          item.code = item.code.split(from).join(to)
        })
      })
    },
    async closeBundle() {
      await optimizeCopiedPublicImages(outDir, minSaving, resizeRules)
    },
  }
}
