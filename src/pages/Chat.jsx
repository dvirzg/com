import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { encryptFile, decryptFile, downloadDecryptedFile } from '../lib/encryption'
import { motion, AnimatePresence } from 'framer-motion'

const Chat = () => {
  const navigate = useNavigate()
  const { user, isAdmin, getFirstName } = useAuth()
  const [loading, setLoading] = useState(true)

  // Chat state
  const [rooms, setRooms] = useState([])
  const [currentRoom, setCurrentRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Refs
  const messagesEndRef = useRef(null)
  const messageInputRef = useRef(null)

  // Check admin access
  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate('/')
    }
  }, [user, isAdmin, navigate])

  // Load chat rooms
  useEffect(() => {
    if (!user || !isAdmin()) return

    loadRooms()
  }, [user, isAdmin])

  // Load messages when room changes
  useEffect(() => {
    if (!currentRoom) return

    loadMessages(currentRoom.id)

    // Subscribe to real-time messages
    const channel = supabase
      .channel(`chat:${currentRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${currentRoom.id}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
          scrollToBottom()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${currentRoom.id}`
        },
        (payload) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentRoom])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false })

      if (error) throw error

      setRooms(data || [])

      // Set current room to pinned room or first room
      if (data && data.length > 0) {
        const pinnedRoom = data.find((r) => r.is_pinned)
        setCurrentRoom(pinnedRoom || data[0])
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading rooms:', error)
      setLoading(false)
    }
  }

  const loadMessages = async (roomId) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const createRoom = async () => {
    if (!newRoomName.trim()) return

    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert([
          {
            name: newRoomName.trim(),
            is_pinned: false,
            created_by: user.id
          }
        ])
        .select()
        .single()

      if (error) throw error

      setRooms((prev) => [data, ...prev])
      setCurrentRoom(data)
      setNewRoomName('')
      setIsCreatingRoom(false)
    } catch (error) {
      console.error('Error creating room:', error)
      alert('Failed to create room')
    }
  }

  const deleteRoom = async (roomId, isPinned) => {
    if (isPinned) {
      alert('Cannot delete the pinned chat')
      return
    }

    if (!confirm('Are you sure you want to delete this chat room?')) return

    try {
      const { error } = await supabase.from('chat_rooms').delete().eq('id', roomId)

      if (error) throw error

      setRooms((prev) => prev.filter((r) => r.id !== roomId))

      if (currentRoom?.id === roomId) {
        const pinnedRoom = rooms.find((r) => r.is_pinned)
        setCurrentRoom(pinnedRoom || rooms[0])
      }
    } catch (error) {
      console.error('Error deleting room:', error)
      alert('Failed to delete room')
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Limit file size to 10MB
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const uploadFile = async (file) => {
    try {
      // Encrypt the file
      const { encryptedData, iv } = await encryptFile(file)

      // Convert encrypted data to Blob
      const encryptedBlob = new Blob([encryptedData])

      // Generate unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${currentRoom.id}/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(filePath, encryptedBlob, {
          contentType: 'application/octet-stream', // Store as binary
          upsert: false
        })

      if (error) throw error

      return {
        path: data.path,
        iv,
        name: file.name,
        type: file.type,
        size: file.size
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()

    const hasMessage = messageInput.trim()
    const hasFile = selectedFile

    if (!hasMessage && !hasFile) return

    setIsUploading(true)

    try {
      let fileData = null

      // Upload file if selected
      if (selectedFile) {
        fileData = await uploadFile(selectedFile)
      }

      // Insert message
      const { error } = await supabase.from('chat_messages').insert([
        {
          room_id: currentRoom.id,
          user_id: user.id,
          message: messageInput.trim() || null,
          file_url: fileData?.path || null,
          file_name: fileData?.name || null,
          file_type: fileData?.type || null,
          file_size: fileData?.size || null,
          encryption_iv: fileData?.iv || null
        }
      ])

      if (error) throw error

      // Clear input
      setMessageInput('')
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Focus back on input
      messageInputRef.current?.focus()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setIsUploading(false)
    }
  }

  const downloadFile = async (message) => {
    try {
      // Download encrypted file from storage
      const { data, error } = await supabase.storage
        .from('chat-files')
        .download(message.file_url)

      if (error) throw error

      // Convert blob to ArrayBuffer
      const encryptedData = await data.arrayBuffer()

      // Decrypt the file
      const decryptedData = await decryptFile(encryptedData, message.encryption_iv)

      // Download the decrypted file
      downloadDecryptedFile(decryptedData, message.file_name, message.file_type)
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Failed to download file')
    }
  }

  const deleteMessage = async (messageId) => {
    if (!confirm('Delete this message?')) return

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Failed to delete message')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    // Less than 1 minute
    if (diff < 60000) return 'Just now'

    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes}m ago`
    }

    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `${hours}h ago`
    }

    // Show date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user || !isAdmin()) {
    return null
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold">Admin Chat</h1>
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setCurrentRoom(room)}
              className={`w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                currentRoom?.id === room.id
                  ? 'bg-gray-100 dark:bg-gray-800'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium truncate">
                  {room.is_pinned && '📌 '}
                  {room.name}
                </span>
                {!room.is_pinned && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteRoom(room.id, room.is_pinned)
                    }}
                    className="text-red-500 hover:text-red-700 text-sm ml-2"
                  >
                    ×
                  </button>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Create new room */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {isCreatingRoom ? (
            <div className="space-y-2">
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Room name..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createRoom()
                  if (e.key === 'Escape') {
                    setIsCreatingRoom(false)
                    setNewRoomName('')
                  }
                }}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={createRoom}
                  className="flex-1 px-3 py-1 bg-black dark:bg-white text-white dark:text-black rounded-md hover:opacity-80"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setIsCreatingRoom(false)
                    setNewRoomName('')
                  }}
                  className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreatingRoom(true)}
              className="w-full px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:opacity-80 transition-opacity"
            >
              + New Chat
            </button>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {currentRoom ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold">
                {currentRoom.is_pinned && '📌 '}
                {currentRoom.name}
              </h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {getFirstName()}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(message.created_at)}
                          </span>
                        </div>

                        {message.message && (
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.message}
                          </p>
                        )}

                        {message.file_url && (
                          <button
                            onClick={() => downloadFile(message)}
                            className="mt-2 inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            <span className="text-xl">📎</span>
                            <div className="text-left">
                              <div className="text-sm font-medium">
                                {message.file_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatFileSize(message.file_size)}
                              </div>
                            </div>
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => deleteMessage(message.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {selectedFile && (
                <div className="mb-2 inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <span className="text-sm">📎 {selectedFile.name}</span>
                  <button
                    onClick={() => {
                      setSelectedFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              )}

              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  disabled={isUploading}
                >
                  📎
                </button>

                <input
                  ref={messageInputRef}
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  disabled={isUploading}
                />

                <button
                  type="submit"
                  disabled={isUploading || (!messageInput.trim() && !selectedFile)}
                  className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            No chat room selected
          </div>
        )}
      </div>
    </div>
  )
}

export default Chat
