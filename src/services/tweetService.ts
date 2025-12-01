import { supabase } from '../lib/supabase';

export interface Tweet {
  id: string;
  content: string;
  created_at: string;
}

export interface TweetReply {
  id: string;
  tweet_id: string;
  content: string;
  sender?: string;
  created_at: string;
  read: boolean;
}

export const tweetService = {
  async getTweets() {
    const { data, error } = await supabase
      .from('tweets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Tweet[];
  },

  async createTweet(content: string) {
    const { data, error } = await supabase
      .from('tweets')
      .insert([{ content }])
      .select()
      .single();

    if (error) throw error;
    return data as Tweet;
  },

  async deleteTweet(id: string) {
    const { error } = await supabase
      .from('tweets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async replyToTweet(tweetId: string, tweetContent: string, replyContent: string, sender: string = '') {
    // 1. Save to DB
    const { error: dbError } = await supabase
      .from('tweet_replies')
      .insert([{ 
        tweet_id: tweetId, 
        content: replyContent,
        sender: sender || 'Anonymous'
      }]);

    if (dbError) throw dbError;

    // 2. Send Email Notification (non-blocking attempt)
    try {
      fetch('/api/send-tweet-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweetContent, replyContent, sender }),
      }).catch(console.error);
    } catch (err) {
      console.error('Failed to trigger email notification', err);
    }
  },

  async getReplies(tweetId: string) {
    const { data, error } = await supabase
      .from('tweet_replies')
      .select('*')
      .eq('tweet_id', tweetId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as TweetReply[];
  }
};
