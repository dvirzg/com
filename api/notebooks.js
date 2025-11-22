import fs from 'fs/promises'
import path from 'path'
import { logger } from './lib/logger.js'

const NOTEBOOKS_DIR = path.join(process.env.HOME, 'Development/causal_inference_public/Favourites')

async function getDirectoryStructure(dirPath, relativePath = '') {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    const items = []

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      const relPath = path.join(relativePath, entry.name)

      if (entry.isDirectory()) {
        const children = await getDirectoryStructure(fullPath, relPath)
        items.push({
          name: entry.name,
          type: 'folder',
          path: relPath,
          children
        })
      } else if (entry.isFile() && (entry.name.endsWith('.ipynb') || entry.name.endsWith('.md'))) {
        items.push({
          name: entry.name,
          type: 'file',
          path: relPath,
          extension: path.extname(entry.name)
        })
      }
    }

    return items.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name)
      return a.type === 'folder' ? -1 : 1
    })
  } catch (err) {
    logger.error('Error reading directory:', err)
    throw err
  }
}

export default async function handler(req, res) {
  try {
    const structure = await getDirectoryStructure(NOTEBOOKS_DIR)

    return res.status(200).json({
      success: true,
      data: structure
    })
  } catch (err) {
    logger.error('Error fetching notebooks structure:', err)
    return res.status(500).json({
      success: false,
      error: 'Error fetching notebooks structure'
    })
  }
}
