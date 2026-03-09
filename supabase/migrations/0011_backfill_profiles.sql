
-- Backfill full_name for existing profiles from auth.users
DO $$
BEGIN
    UPDATE public.profiles p
    SET full_name = (
        SELECT raw_user_meta_data->>'full_name' 
        FROM auth.users u 
        WHERE u.id = p.id
    )
    WHERE p.full_name IS NULL;
END $$;
