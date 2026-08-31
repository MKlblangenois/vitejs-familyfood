-- ============================================================
-- Migration: Recipe image storage bucket + RLS policies
-- Task: 5.1 + 5.6
-- Creates a public `recipe-images` storage bucket and RLS
-- policies on `storage.objects` so that:
--   - authenticated users can upload/update/delete their own
--     objects (path prefix = user id)
--   - anyone can read (public bucket)
-- ============================================================

-- ==================
-- BUCKET
-- ==================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recipe-images',
  'recipe-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- ==================
-- RLS POLICIES (storage.objects)
-- ==================

-- Authenticated users can upload their own objects.
-- Ownership is enforced by requiring the first path segment to equal the
-- authenticated user's id (e.g. `<user_id>/<recipe_id>/<file>`).
create policy "recipe_images_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can update their own objects.
create policy "recipe_images_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can delete their own objects.
create policy "recipe_images_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'recipe-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Anyone can read objects in the public bucket.
create policy "recipe_images_select_public"
  on storage.objects
  for select
  to public
  using (bucket_id = 'recipe-images');
