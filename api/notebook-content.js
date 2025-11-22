import fs from 'fs/promises'
import path from 'path'
import { logger } from './lib/logger.js'

const NOTEBOOKS_DIR = path.join(process.env.HOME, 'Development/causal_inference_public/Favourites')

export default async function handler(req, res) {
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
      // Parse and return the notebook JSON
      const notebook = JSON.parse(content)
      return res.status(200).json({
        success: true,
        type: 'notebook',
        data: notebook
      })
    } else if (extension === '.md') {
      // Return markdown as plain text
      return res.status(200).json({
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
    logger.error('Error reading file:', err)
    return res.status(500).json({
      success: false,
      error: 'Error reading file content'
    })
  }
}
