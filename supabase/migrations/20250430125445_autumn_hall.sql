/*
  # Initial schema for TikTok clone

  1. New Tables
    - videos
      - id (uuid, primary key)
      - url (text)
      - username (text)
      - description (text)
      - created_at (timestamp)
    - likes
      - id (uuid, primary key)
      - video_id (uuid, foreign key)
      - user_id (uuid, foreign key)
      - created_at (timestamp)
    - comments
      - id (uuid, primary key)
      - video_id (uuid, foreign key)
      - user_id (uuid, foreign key)
      - text (text)
      - created_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create videos table
CREATE TABLE videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  username text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create likes table
CREATE TABLE likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- Create comments table
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid REFERENCES videos(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policies for videos
CREATE POLICY "Videos are viewable by everyone"
  ON videos FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can upload videos"
  ON videos FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for likes
CREATE POLICY "Users can view all likes"
  ON likes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can like videos"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can unlike their likes"
  ON likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for comments
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can comment"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);