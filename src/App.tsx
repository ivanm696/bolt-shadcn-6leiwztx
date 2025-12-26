import { useEffect, useState } from 'react';
import { Share2, Heart, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from './lib/supabase';
import './App.css';

interface Video {
  id: string;
  url: string;
  username: string;
  description: string;
  likes: number;
  comments: number;
}

interface Comment {
  id: string;
  text: string;
  username: string;
  created_at: string;
}

function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [session, setSession] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    fetchVideos();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) alert(error.message);
    else alert('Check your email for the confirmation link!');
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert(error.message);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching videos:', error);
      return;
    }

    setVideos(data);
  };

  const fetchComments = async (videoId: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('video_id', videoId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return;
    }

    setComments(prev => ({ ...prev, [videoId]: data }));
  };

  const handleLike = async (videoId: string) => {
    if (!session) {
      alert('Please sign in to like videos');
      return;
    }

    const newLikeStatus = !liked[videoId];
    setLiked(prev => ({ ...prev, [videoId]: newLikeStatus }));

    const { error } = await supabase
      .from('likes')
      .upsert({ 
        user_id: session.user.id,
        video_id: videoId,
        liked: newLikeStatus
      });

    if (error) {
      console.error('Error updating like:', error);
      setLiked(prev => ({ ...prev, [videoId]: !newLikeStatus }));
    }
  };

  const handleComment = async (videoId: string) => {
    if (!session) {
      alert('Please sign in to comment');
      return;
    }

    if (!newComment.trim()) return;

    const { error } = await supabase
      .from('comments')
      .insert({
        video_id: videoId,
        user_id: session.user.id,
        text: newComment,
        username: session.user.email
      });

    if (error) {
      console.error('Error posting comment:', error);
      return;
    }

    setNewComment('');
    fetchComments(videoId);
  };

  const shareToTelegram = (video: Video) => {
    const text = `Check out this video by ${video.username}: ${video.description}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Card className="w-[350px] p-6">
          <form onSubmit={handleSignIn} className="space-y-4">
            <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : 'Sign In'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleSignUp}
              disabled={loading}
            >
              Sign Up
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed top-4 right-4 z-50">
        <Button variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
      <ScrollArea className="h-screen w-full">
        <div className="max-w-md mx-auto">
          {videos.map((video) => (
            <Card 
              key={video.id} 
              className="relative aspect-[9/16] mb-1 overflow-hidden bg-neutral-900 border-none"
            >
              <video 
                src={video.url} 
                className="absolute inset-0 w-full h-full object-cover"
                loop
                playsInline
                controls
              />
              
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-end justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold">{video.username}</h3>
                    <p className="text-sm text-gray-300">{video.description}</p>
                  </div>
                  
                  <div className="flex flex-col gap-4 items-center ml-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full bg-black/20 hover:bg-black/40"
                      onClick={() => handleLike(video.id)}
                    >
                      <Heart 
                        className={liked[video.id] ? "fill-red-500 stroke-red-500" : ""} 
                      />
                      <span className="text-xs mt-1">{video.likes}</span>
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="rounded-full bg-black/20 hover:bg-black/40"
                          onClick={() => {
                            setSelectedVideo(video.id);
                            fetchComments(video.id);
                          }}
                        >
                          <MessageCircle />
                          <span className="text-xs mt-1">{video.comments}</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Comments</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-y-auto">
                          {comments[video.id]?.map((comment) => (
                            <div key={comment.id} className="py-2">
                              <p className="font-bold">{comment.username}</p>
                              <p>{comment.text}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Input
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                          />
                          <Button onClick={() => handleComment(video.id)}>Post</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="rounded-full bg-black/20 hover:bg-black/40"
                      onClick={() => shareToTelegram(video)}
                    >
                      <Send />
                      <span className="text-xs mt-1">Share</span>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export default App;