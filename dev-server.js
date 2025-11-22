import express from 'express'
import cors from 'cors'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import os from 'os'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001

const NOTEBOOKS_DIR = path.join(os.homedir(), 'Development/causal_inference_public/Favourites')

app.use(cors())
app.use(express.json())

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
    console.error('Error reading directory:', err)
    throw err
  }
}

app.get('/api/notebooks', async (req, res) => {
  try {
    const structure = await getDirectoryStructure(NOTEBOOKS_DIR)
    res.json({
      success: true,
      data: structure
    })
  } catch (err) {
    console.error('Error fetching notebooks structure:', err)
    res.status(500).json({
      success: false,
      error: 'Error fetching notebooks structure'
    })
  }
})

app.get('/api/notebook-content', async (req, res) => {
  const filePath = req.query.path

  if (!filePath) {
    return res.status(400).json({
      success: false,
      error: 'File path is required'
    })
  }

  try {
    const fullPath = path.join(NOTEBOOKS_DIR, filePath)

    // Security check: ensure the path is within NOTEBOOKS_DIR
    const normalizedPath = path.normalize(fullPath)
    if (!normalizedPath.startsWith(NOTEBOOKS_DIR)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      })
    }

    const content = await fs.readFile(fullPath, 'utf-8')
    const extension = path.extname(filePath)

    if (extension === '.ipynb') {
      const notebook = JSON.parse(content)
      return res.json({
        success: true,
        type: 'notebook',
        data: notebook
      })
    } else if (extension === '.md') {
      return res.json({
        success: true,
        type: 'markdown',
        data: content
      })
    } else {
      return res.status(400).json({
        success: false,
        error: 'Unsupported file type'
      })
    }
  } catch (err) {
    console.error('Error reading file:', err)
    res.status(500).json({
      success: false,
      error: 'Error reading file content'
    })
  }
})

app.listen(PORT, () => {
  console.log(`Dev API server running on http://localhost:${PORT}`)
})
