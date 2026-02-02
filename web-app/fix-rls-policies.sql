-- Fix RLS policies for profiles table to allow all authenticated users to read

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new policies
-- Allow all authenticated users to view all profiles (for chat/search)
CREATE POLICY "Authenticated users can view all profiles" ON profiles
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Allow users to update only their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE 
    USING (auth.uid() = id);

-- Allow users to insert their own profile during registration
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);
