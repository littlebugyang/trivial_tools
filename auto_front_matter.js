/*
 * @Date: 2021-04-15 21:57:31
 * @LastEditors: lby
 */
const { promisify } = require('util')
const { resolve, parse, relative, dirname } = require('path')
const fs = require('fs')
const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)
const moment = require('moment')

const sourceDir = './source'
const targetDir = './target'

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
    const subtractBase = relative(sourceDir, paths[i])
    const parsedPath = parse(paths[i])


    if (parsedPath.ext === '.md') {
      const article = fs.readFileSync(paths[i], { encoding: 'utf8' })
      const targetPath = resolve(targetDir, subtractBase)
      const stat = fs.statSync(paths[i])
      fs.mkdirSync(dirname(targetPath), { recursive: true })
      fs.writeFileSync(
        targetPath,
        `---
        title: ${parsedPath.name}
        date: ${moment(stat.mtime).format('YYYY/MM/DD HH:mm:ss')}
        updated: ${moment(stat.mtime).format('YYYY/MM/DD HH:mm:ss')}
        categories:
        ---
        `.replace(/^(\s)+/gm, '') + article
      )
    }
  }
  console.log('Done. ')
}

getFiles(sourceDir)
  .then(addFrontMatter)
  .catch((e) => console.error(e))
