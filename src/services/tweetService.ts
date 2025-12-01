import { supabase } from '../lib/supabase';

export interface Tweet {
  id: string;
  content: string;
  created_at: string;
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
  }
};

