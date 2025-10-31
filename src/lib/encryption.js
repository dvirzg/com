/**
 * Encryption utilities for secure file storage
 * Uses Web Crypto API (AES-GCM) for client-side encryption
 */

// Generate a random encryption key (should be stored securely)
// In a production environment, you might want to derive this from user credentials
// or store it securely. For now, we'll use a consistent key stored in the browser.
const ENCRYPTION_KEY_NAME = 'admin_chat_encryption_key'

/**
 * Gets or creates an encryption key
 */
async function getEncryptionKey() {
  // Try to get existing key from localStorage
  const storedKey = localStorage.getItem(ENCRYPTION_KEY_NAME)

  if (storedKey) {
    // Import the stored key
    const keyData = JSON.parse(storedKey)
    return await crypto.subtle.importKey(
      'jwk',
      keyData,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
  }

  // Generate a new key
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )

  // Export and store the key
  const exportedKey = await crypto.subtle.exportKey('jwk', key)
  localStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(exportedKey))

  return key
}

/**
 * Encrypts a file
 * @param {File} file - The file to encrypt
 * @returns {Promise<{encryptedData: ArrayBuffer, iv: string}>}
 */
export async function encryptFile(file) {
  try {
    const key = await getEncryptionKey()

    // Generate a random initialization vector
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Read file as ArrayBuffer
    const fileData = await file.arrayBuffer()

    // Encrypt the file
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      fileData
    )

    // Convert IV to base64 for storage
    const ivBase64 = btoa(String.fromCharCode(...iv))

    return {
      encryptedData,
      iv: ivBase64
    }
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt file')
  }
}

/**
 * Decrypts a file
 * @param {ArrayBuffer} encryptedData - The encrypted file data
 * @param {string} ivBase64 - The initialization vector in base64
 * @returns {Promise<ArrayBuffer>}
 */
export async function decryptFile(encryptedData, ivBase64) {
  try {
    const key = await getEncryptionKey()

    // Convert IV from base64
    const ivString = atob(ivBase64)
    const iv = new Uint8Array(ivString.length)
    for (let i = 0; i < ivString.length; i++) {
      iv[i] = ivString.charCodeAt(i)
    }

    // Decrypt the file
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    )

    return decryptedData
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt file')
  }
}

/**
 * Downloads a decrypted file
 * @param {ArrayBuffer} decryptedData - The decrypted file data
 * @param {string} fileName - The original file name
 * @param {string} mimeType - The file MIME type
 */
export function downloadDecryptedFile(decryptedData, fileName, mimeType) {
  const blob = new Blob([decryptedData], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up the URL
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * Creates a preview URL for decrypted file (for images, videos, etc.)
 * @param {ArrayBuffer} decryptedData - The decrypted file data
 * @param {string} mimeType - The file MIME type
 * @returns {string} Object URL
 */
export function createPreviewUrl(decryptedData, mimeType) {
  const blob = new Blob([decryptedData], { type: mimeType })
  return URL.createObjectURL(blob)
}
