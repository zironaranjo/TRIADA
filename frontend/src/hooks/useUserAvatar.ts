import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook to load the current user's avatar URL.
 * Checks localStorage first, then falls back to listing Supabase Storage.
 */
export function useUserAvatar() {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Check localStorage first
            const savedPath = localStorage.getItem(`triadak_avatar_${user.id}`);
            if (savedPath) {
                const { data } = supabase.storage.from('property-images').getPublicUrl(savedPath);
                try {
                    const res = await fetch(data.publicUrl, { method: 'HEAD' });
                    if (res.ok) {
                        setAvatarUrl(data.publicUrl + '?t=' + Date.now());
                        return;
                    }
                } catch { /* fallback below */ }
            }

            // Fallback: list files in avatar folder
            try {
                const { data: files } = await supabase.storage.from('property-images').list(`avatars/${user.id}`);
                if (files && files.length > 0) {
                    const filePath = `avatars/${user.id}/${files[0].name}`;
                    localStorage.setItem(`triadak_avatar_${user.id}`, filePath);
                    const { data } = supabase.storage.from('property-images').getPublicUrl(filePath);
                    setAvatarUrl(data.publicUrl + '?t=' + Date.now());
                }
            } catch { /* no avatar */ }
        };
        load();
    }, []);

    return avatarUrl;
}
