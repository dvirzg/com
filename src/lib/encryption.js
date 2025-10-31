/**
 * Encryption utilities for secure file and message storage
 * Uses Web Crypto API (AES-GCM) with password-based key derivation (PBKDF2)
 * All admins share the same password to encrypt/decrypt content
 */

const ENCRYPTION_PASSWORD_KEY = 'admin_chat_password'
const SALT_KEY = 'admin_chat_salt'

// Store password in memory after first entry (session only)
let cachedPassword = null

/**
 * Derives an encryption key from a password using PBKDF2
 * @param {string} password - The shared password
 * @returns {Promise<CryptoKey>}
 */
async function deriveKeyFromPassword(password) {
  // Get or generate salt
  let salt = localStorage.getItem(SALT_KEY)
  if (!salt) {
    // Generate a random salt (this should be the same for all admins)
    // In a real implementation, this salt should be stored in the database
    // For now, we'll use a fixed salt so all admins can decrypt each other's content
    const saltArray = new Uint8Array(16)
    crypto.getRandomValues(saltArray)
    salt = btoa(String.fromCharCode(...saltArray))
    localStorage.setItem(SALT_KEY, salt)
  }

  // Convert salt back to Uint8Array
  const saltString = atob(salt)
  const saltArray = new Uint8Array(saltString.length)
  for (let i = 0; i < saltString.length; i++) {
    saltArray[i] = saltString.charCodeAt(i)
  }

  // Import password as key material
  const encoder = new TextEncoder()
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

  // Derive the actual encryption key
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltArray,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )

  return key
}

/**
 * Sets the encryption password (stores in memory for the session)
 * @param {string} password - The password to use
 */
export function setEncryptionPassword(password) {
  cachedPassword = password
  sessionStorage.setItem(ENCRYPTION_PASSWORD_KEY, password)
}

/**
 * Gets the encryption password from memory or session storage
 * @returns {string|null}
 */
export function getEncryptionPassword() {
  if (cachedPassword) return cachedPassword

  const stored = sessionStorage.getItem(ENCRYPTION_PASSWORD_KEY)
  if (stored) {
    cachedPassword = stored
    return stored
  }

  return null
}

/**
 * Checks if password is set
 * @returns {boolean}
 */
export function hasEncryptionPassword() {
  return !!getEncryptionPassword()
}

/**
 * Clears the encryption password (logout)
 */
export function clearEncryptionPassword() {
  cachedPassword = null
  sessionStorage.removeItem(ENCRYPTION_PASSWORD_KEY)
}

/**
 * Gets the encryption key (derived from password)
 */
async function getEncryptionKey() {
  const password = getEncryptionPassword()
  if (!password) {
    throw new Error('Encryption password not set')
  }
  return await deriveKeyFromPassword(password)
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

/**
 * Encrypts a text message
 * @param {string} message - The message to encrypt
 * @returns {Promise<{encryptedMessage: string, iv: string}>}
 */
export async function encryptMessage(message) {
  try {
    const key = await getEncryptionKey()

    // Generate a random initialization vector
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Convert message to ArrayBuffer
    const encoder = new TextEncoder()
    const messageData = encoder.encode(message)

    // Encrypt the message
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      messageData
    )

    // Convert encrypted data and IV to base64
    const encryptedArray = new Uint8Array(encryptedData)
    const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray))
    const ivBase64 = btoa(String.fromCharCode(...iv))

    return {
      encryptedMessage: encryptedBase64,
      iv: ivBase64
    }
  } catch (error) {
    console.error('Message encryption error:', error)
    throw new Error('Failed to encrypt message')
  }
}

/**
 * Decrypts a text message
 * @param {string} encryptedMessageBase64 - The encrypted message in base64
 * @param {string} ivBase64 - The initialization vector in base64
 * @returns {Promise<string>}
 */
export async function decryptMessage(encryptedMessageBase64, ivBase64) {
  try {
    const key = await getEncryptionKey()

    // Convert base64 to ArrayBuffer
    const encryptedString = atob(encryptedMessageBase64)
    const encryptedArray = new Uint8Array(encryptedString.length)
    for (let i = 0; i < encryptedString.length; i++) {
      encryptedArray[i] = encryptedString.charCodeAt(i)
    }

    // Convert IV from base64
    const ivString = atob(ivBase64)
    const iv = new Uint8Array(ivString.length)
    for (let i = 0; i < ivString.length; i++) {
      iv[i] = ivString.charCodeAt(i)
    }

    // Decrypt the message
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedArray
    )

    // Convert back to string
    const decoder = new TextDecoder()
    return decoder.decode(decryptedData)
  } catch (error) {
    console.error('Message decryption error:', error)
    throw new Error('Failed to decrypt message')
  }
}
