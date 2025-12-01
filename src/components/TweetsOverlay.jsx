import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Send, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tweetService } from '../services/tweetService';
import { formatDistanceToNow } from 'date-fns';

const TweetsOverlay = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [latestTweet, setLatestTweet] = useState(null);
  const [newTweet, setNewTweet] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadLatestTweet();
  }, []);

  const loadLatestTweet = async () => {
    try {
      const tweets = await tweetService.getTweets();
      if (tweets.length > 0) {
        setLatestTweet(tweets[0]);
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
      setLatestTweet(tweet);
      setNewTweet('');
    } catch (error) {
      console.error('Failed to post tweet:', error);
    } finally {
      setSending(false);
    }
  };

  // If no tweets and not admin, don't show anything (or maybe just the icon?)
  // Showing icon to invite curiosity is good.
  
  return (
    <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[calc(100vw-3rem)] md:w-80 max-w-[20rem] bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden origin-bottom-right"
          >
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">Latest Update</h3>
              <Link 
                to="/tweets"
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 flex items-center gap-1"
                onClick={() => setIsOpen(false)}
              >
                View all <Maximize2 size={12} />
              </Link>
            </div>

            <div className="p-4 max-h-60 overflow-y-auto">
              {loading ? (
                <div className="animate-pulse h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-3/4"></div>
              ) : latestTweet ? (
                <Link 
                  to={`/tweets?id=${latestTweet.id}`}
                  onClick={() => setIsOpen(false)}
                  className="block group"
                >
                  <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                    {latestTweet.content}
                  </p>
                  <p className="text-xs text-zinc-400 mt-2">
                    {formatDistanceToNow(new Date(latestTweet.created_at), { addSuffix: true })}
                  </p>
                </Link>
              ) : (
                <p className="text-zinc-400 text-sm italic">No updates yet...</p>
              )}
            </div>

            {isAdmin() && (
              <form onSubmit={handlePost} className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="relative">
                  <input
                    type="text"
                    value={newTweet}
                    onChange={(e) => setNewTweet(e.target.value)}
                    placeholder="Post update..."
                    className="w-full pl-3 pr-10 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 dark:text-white"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={!newTweet.trim() || sending}
                    className="absolute right-1 top-1 p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-50 transition-colors"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-all ${
          isOpen 
            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white' 
            : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800'
        } border border-zinc-200 dark:border-zinc-800`}
      >
        {isOpen ? <X size={20} /> : (
          <div className="relative">
            <Bell size={20} />
            {latestTweet && !isOpen && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900"></span>
            )}
          </div>
        )}
      </motion.button>
    </div>
  );
};

export default TweetsOverlay;

