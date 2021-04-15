/*
 * @Date: 2021-04-15 21:57:31
 * @LastEditors: lby
 */
const { promisify } = require('util')
const { resolve, parse, relative } = require('path')
const fs = require('fs')
const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)

const baseDir = ''
const targetDir = ''

async function getFiles(dir) {
  const subdirs = await readdir(dir)
  const files = await Promise.all(
    subdirs.map(async (subdir) => {
      const res = resolve(dir, subdir)
      return (await stat(res)).isDirectory() ? getFiles(res) : res
    })
  )
  return files.reduce((a, f) => a.concat(f), [])
}

function addFrontMatter(paths) {
  for (let i = 0; i < paths.length; ++i) {
    const subtractBase = relative(baseDir, paths[i])
    const parsedPath = parse(paths[i])

    if (parsedPath.ext === '.md') {
      const article = fs.readFileSync(paths[i], { encoding: 'utf8' })
      const targetPath = resolve(targetDir, subtractBase)
      console.log(targetPath)
      fs.writeFileSync(
        targetPath,
        `---\ntitle: ${parsedPath.name}\ncategories:\n---\n${article}`
      )
    }
  }
}

getFiles(baseDir)
  .then(addFrontMatter)
  .catch((e) => console.error(e))
console.log('Done. ')
