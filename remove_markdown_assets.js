// Remove unused images in asset folders

const { promisify } = require('util')
const { resolve, parse } = require('path')
const fs = require('fs')
const readdir = promisify(fs.readdir)
const stat = promisify(fs.stat)
const moment = require('moment')

const postDir = './_posts'

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

function parseFrontMatter(content) {
    let ret = { frontMatter: undefined, body: content }

    // CRLF to LF
    content = content.trimStart().replace(/\r\n/g, '\n')

    const indexOfStart = content.indexOf("---\n")
    // no legal starting front matter
    if (indexOfStart != 0) return ret

    const indexOfEnd = content.indexOf("---\n", 4)
    // no legal ending front matter
    if (indexOfEnd == -1) return ret


    ret.frontMatter = {}
    ret.body = content.slice(indexOfEnd + 4)

    const lines = content.slice(4, indexOfEnd).trimEnd().split('\n')
    for (let i = 0; i < lines.length; ++i) {
        const strs = lines[i].trim().split(':', 2)
        // make sure only the first colon is the separator
        if (strs.length == 2)
            ret.frontMatter[strs[0].trim()] = lines[i].slice(strs[0].length + 1).trim()
    }
    return ret
}

function addFrontMatter(paths) {
    for (let i = 0; i < paths.length; ++i) {
        const parsedPath = parse(paths[i])


        if (parsedPath.ext === '.md') {
            const article = fs.readFileSync(paths[i], { encoding: 'utf8' })
            let { frontMatter, body } = parseFrontMatter(article)
            let ignore = false
            if (frontMatter == undefined) {
                frontMatter = {}
                frontMatter.title = parsedPath.name
                frontMatter.date = moment().format('YYYY/MM/DD HH:mm:ss')
                frontMatter.updated = frontMatter.date
                frontMatter.categories = ""
                console.log(`Add front matter to ${paths[i]}. `)
            }
            else {
                // only update the property named "updated"
                const stat = fs.statSync(paths[i])
                const newUpdated = moment(stat.mtime)
                const oldUpdated = moment(frontMatter.updated, "YYYY/MM/DD HH:mm:ss")
                if (newUpdated.diff(oldUpdated, 'minutes') > 5) {
                    console.log(`"updated" of ${paths[i]} needs to be updated. `)
                    frontMatter.updated = newUpdated.format('YYYY/MM/DD HH:mm:ss')
                }
                else
                    ignore = true
            }

            if (!ignore) {
                let writeContent = "---\n"
                for (const prop in frontMatter)
                    writeContent += `${prop}: ${frontMatter[prop]}\n`
                writeContent += `---\n${body}`

                fs.writeFileSync(paths[i], writeContent)
            }
        }
    }
    console.log('Done. ')
}

getFiles(postDir)
    .then(addFrontMatter)
    .catch((e) => console.error(e))
