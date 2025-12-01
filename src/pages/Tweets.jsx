import { useState, useEffect, useRef } from 'react';
import { Trash2, Send, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { tweetService } from '../services/tweetService';
import { formatDistanceToNow } from 'date-fns';
import Loading from '../components/Loading';
import ConfirmDialog from '../components/ConfirmDialog';
import ScrollToTop from '../components/ScrollToTop';
import { useTheme } from '../contexts/ThemeContext';
import { BACKGROUND_COLORS } from '../constants/colors';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const Tweets = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTweet, setNewTweet] = useState('');
  const [sending, setSending] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, tweetId: null });
  const [showStickyTitle, setShowStickyTitle] = useState(false);
  const [searchParams] = useSearchParams();
  
  // Reply state
  const [expandedTweetId, setExpandedTweetId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [senderName, setSenderName] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replies, setReplies] = useState({}); // tweetId -> replies[] (for admin)

  const titleRef = useRef(null);
  
  const { isAdmin } = useAuth();
  const { isDark, backgroundColor } = useTheme();

  useEffect(() => {
    loadTweets();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (titleRef.current) {
        const titleRect = titleRef.current.getBoundingClientRect();
        setShowStickyTitle(titleRect.top < 80);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadTweets = async () => {
    try {
      const data = await tweetService.getTweets();
      setTweets(data);

      // If we have tweets, mark the latest as seen in localStorage
      if (data.length > 0) {
        localStorage.setItem('last_seen_tweet_id', data[0].id);
      }
      
      // Check for ID in URL and expand if found
      const idFromUrl = searchParams.get('id');
      if (idFromUrl) {
        const targetTweet = data.find(t => t.id === idFromUrl);
        if (targetTweet) {
          handleTweetClick(targetTweet.id);
          // Optional: scroll to tweet
          setTimeout(() => {
            const element = document.getElementById(`tweet-${targetTweet.id}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('Failed to load tweets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newTweet.trim()) return;

    setSending(true);
    try {
      const tweet = await tweetService.createTweet(newTweet);
      setTweets([tweet, ...tweets]);
      setNewTweet('');
    } catch (error) {
      console.error('Failed to post tweet:', error);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteClick = (tweetId) => {
    setDeleteDialog({ isOpen: true, tweetId });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.tweetId) {
      try {
        await tweetService.deleteTweet(deleteDialog.tweetId);
        setTweets(tweets.filter(t => t.id !== deleteDialog.tweetId));
        if (expandedTweetId === deleteDialog.tweetId) {
          setExpandedTweetId(null);
        }
      } catch (error) {
        console.error('Failed to delete tweet:', error);
        alert('Failed to delete tweet');
      }
      setDeleteDialog({ isOpen: false, tweetId: null });
    }
  };

  const handleTweetClick = async (tweetId) => {
    if (expandedTweetId === tweetId) {
      setExpandedTweetId(null);
      setReplyContent('');
      setSenderName('');
    } else {
      setExpandedTweetId(tweetId);
      setReplyContent('');
      setSenderName('');
      if (isAdmin()) {
        loadReplies(tweetId);
      }
    }
  };

  const loadReplies = async (tweetId) => {
    try {
      const data = await tweetService.getReplies(tweetId);
      setReplies(prev => ({ ...prev, [tweetId]: data }));
    } catch (error) {
      console.error('Failed to load replies:', error);
    }
  };

  const handleSendReply = async (tweet) => {
    if (!replyContent.trim() || !senderName.trim()) return;

    setSendingReply(true);
    try {
      await tweetService.replyToTweet(tweet.id, tweet.content, replyContent, senderName);
      alert('Reply sent!'); // Simple feedback
      setExpandedTweetId(null);
      setReplyContent('');
      setSenderName('');
    } catch (error) {
      console.error('Failed to send reply:', error);
      alert('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const stickyBgColor = isDark
    ? 'rgba(0, 0, 0, 0.8)'
    : `${BACKGROUND_COLORS[backgroundColor] || BACKGROUND_COLORS.white}B3`;

  return (
    <>
      {/* Sticky Title Header */}
      <div
        className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-xl transition-all duration-300 ${
          showStickyTitle ? 'translate-y-0 border-b border-zinc-200/50 dark:border-zinc-800/30' : '-translate-y-full'
        }`}
        style={{ backgroundColor: stickyBgColor }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-lg font-bold text-zinc-900 dark:text-white">
              Thoughts
            </h1>
          </div>
        </div>
      </div>

      <div className="min-h-screen pt-24 pb-12 px-6 transition-colors">
        <div className="max-w-3xl mx-auto">
          <h1 ref={titleRef} className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-12">
            Thoughts
          </h1>

          {isAdmin() && (
            <form onSubmit={handlePost} className="mb-12">
              <div className="relative">
                <textarea
                  value={newTweet}
                  onChange={(e) => setNewTweet(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full p-4 pr-12 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-700 resize-none min-h-[100px]"
                  disabled={sending}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handlePost(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!newTweet.trim() || sending}
                  className="absolute right-3 bottom-3 p-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:opacity-80 disabled:opacity-50 transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <Loading fullScreen={false} />
          ) : tweets.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400 italic text-center py-12">
              No thoughts shared yet.
            </p>
          ) : (
            <div className="space-y-8">
              {tweets.map((tweet) => (
                <div key={tweet.id} id={`tweet-${tweet.id}`} className="group">
                  <div 
                    className={`relative pl-6 border-l-2 transition-all cursor-pointer ${
                      expandedTweetId === tweet.id 
                        ? 'border-zinc-900 dark:border-white' 
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                    }`}
                    onClick={() => handleTweetClick(tweet.id)}
                  >
                    <div className="text-lg text-zinc-800 dark:text-zinc-200 mb-2 leading-relaxed prose dark:prose-invert max-w-none">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm, remarkBreaks, remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          a: ({node, ...props}) => (
                            <a 
                              {...props} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                              onClick={(e) => e.stopPropagation()} 
                            />
                          ),
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
                        }}
                      >
                        {tweet.content}
                      </ReactMarkdown>
                    </div>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wider">
                      {formatDistanceToNow(new Date(tweet.created_at), { addSuffix: true })}
                    </p>

                    {isAdmin() && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(tweet.id);
                        }}
                        className="absolute top-0 right-0 p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <AnimatePresence>
                    {expandedTweetId === tweet.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-6 overflow-hidden"
                      >
                        <div className="pt-4 pb-2">
                          {!isAdmin() ? (
                            <div className="flex flex-col gap-2">
                              <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Reply..."
                                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:focus:ring-zinc-700 dark:text-white resize-none min-h-[80px]"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendReply(tweet);
                                  }
                                }}
                              />
                              <div className="flex justify-between items-center gap-3 px-1">
                                <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                                  <span className="text-sm text-zinc-400 dark:text-zinc-500 italic">By</span>
                                  <input
                                    type="text"
                                    value={senderName}
                                    onChange={(e) => setSenderName(e.target.value)}
                                    placeholder="your name"
                                    className="bg-transparent border-b border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 focus:border-zinc-400 dark:focus:border-zinc-500 text-sm text-zinc-600 dark:text-zinc-300 focus:text-zinc-900 dark:focus:text-zinc-100 focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-600 py-0.5 w-full transition-colors"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendReply(tweet);
                                      }
                                    }}
                                  />
                                </div>
                                <button
                                  onClick={() => handleSendReply(tweet)}
                                  disabled={!replyContent.trim() || !senderName.trim() || sendingReply}
                                  className="px-4 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                                >
                                  {sendingReply ? 'Sending...' : 'Reply'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3 mt-2">
                              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                                <MessageCircle size={12} />
                                Replies
                              </h4>
                              {!replies[tweet.id] ? (
                                <div className="h-4 w-20 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
                              ) : replies[tweet.id].length === 0 ? (
                                <p className="text-sm text-zinc-400 italic">No replies yet.</p>
                              ) : (
                                <div className="space-y-3">
                                  {replies[tweet.id].map(reply => (
                                    <div key={reply.id} className="bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/50">
                                      <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-medium text-zinc-900 dark:text-white">
                                          {reply.sender || 'Anonymous'}
                                        </span>
                                        <span className="text-xs text-zinc-400">
                                          {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                        </span>
                                      </div>
                                      <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{reply.content}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, tweetId: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Thought"
        message="Are you sure you want to delete this thought?"
        confirmText="Delete"
        cancelText="Cancel"
      />
      <ScrollToTop />
    </>
  );
};

export default Tweets;
