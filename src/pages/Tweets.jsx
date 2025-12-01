import { useState, useEffect, useRef } from 'react';
import { Trash2, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { tweetService } from '../services/tweetService';
import { formatDistanceToNow } from 'date-fns';
import Loading from '../components/Loading';
import ConfirmDialog from '../components/ConfirmDialog';
import ScrollToTop from '../components/ScrollToTop';
import { useTheme } from '../contexts/ThemeContext';
import { BACKGROUND_COLORS } from '../constants/colors';

const Tweets = () => {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTweet, setNewTweet] = useState('');
  const [sending, setSending] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, tweetId: null });
  const [showStickyTitle, setShowStickyTitle] = useState(false);
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
      } catch (error) {
        console.error('Failed to delete tweet:', error);
        alert('Failed to delete tweet');
      }
      setDeleteDialog({ isOpen: false, tweetId: null });
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
                <div key={tweet.id} className="group relative pl-6 border-l-2 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors">
                  <p className="text-lg text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap mb-2 leading-relaxed">
                    {tweet.content}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wider">
                    {formatDistanceToNow(new Date(tweet.created_at), { addSuffix: true })}
                  </p>

                  {isAdmin() && (
                    <button
                      onClick={() => handleDeleteClick(tweet.id)}
                      className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
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

