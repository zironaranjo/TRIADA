import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'owner' | 'staff';

interface Profile {
    id: string;
    user_id: string;
    email: string;
    full_name: string | null;
    role: UserRole;
    created_at: string;
    updated_at: string;
}

export interface UserSubscription {
    id: string;
    user_id: string;
    plan_id: string;
    status: string;
    interval: string;
    current_period_start: string;
    current_period_end: string | null;
}

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    subscription: UserSubscription | null;
    loading: boolean;
    isAdmin: boolean;
    isOwner: boolean;
    isStaff: boolean;
    hasActivePlan: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [subscription, setSubscription] = useState<UserSubscription | null>(null);
    const [loading, setLoading] = useState(true);

    /**
     * Determine the correct role for a user based on:
     * 1. First user ever → admin
     * 2. Email matches owner table → owner
     * 3. Otherwise → staff
     */
    const determineRole = async (email: string): Promise<UserRole> => {
        try {
            // Check if this is the very first user (no other profiles exist)
            const { count } = await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true });

            if (count !== null && count <= 1) {
                return 'admin';
            }

            // Check if email matches an owner record
            const { data: ownerMatch } = await supabase
                .from('owner')
                .select('id')
                .eq('email', email)
                .maybeSingle();

            if (ownerMatch) {
                return 'owner';
            }

            // Default role
            return 'staff';
        } catch {
            return 'staff';
        }
    };

    const fetchProfile = async (userId: string, userEmail?: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                return null;
            }

            const profileData = data as Profile;

            // Auto-assign role if not set or still default
            if (userEmail && (!profileData.role || profileData.role === 'staff')) {
                const correctRole = await determineRole(userEmail);
                if (correctRole !== profileData.role) {
                    await supabase
                        .from('profiles')
                        .update({ role: correctRole })
                        .eq('user_id', userId);
                    profileData.role = correctRole;
                }
            }

            return profileData;
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    };

    const fetchSubscription = async (userId: string) => {
        try {
            const { data } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            return data as UserSubscription | null;
        } catch (error) {
            console.warn('Subscriptions table may not exist yet:', error);
            return null;
        }
    };

    const refreshProfile = async () => {
        if (user) {
            const newProfile = await fetchProfile(user.id);
            setProfile(newProfile);
        }
    };

    const refreshSubscription = async () => {
        if (user) {
            const newSub = await fetchSubscription(user.id);
            setSubscription(newSub);
        }
    };

    useEffect(() => {
        // Safety timeout: if auth takes more than 3s, stop loading anyway
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 3000);

        // Get initial session
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            try {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    const [userProfile, userSub] = await Promise.all([
                        fetchProfile(session.user.id, session.user.email),
                        fetchSubscription(session.user.id),
                    ]);
                    setProfile(userProfile);
                    setSubscription(userSub);
                }
            } catch (err) {
                console.error('Error initializing auth session:', err);
            } finally {
                clearTimeout(timeout);
                setLoading(false);
            }
        }).catch(() => {
            clearTimeout(timeout);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    const [userProfile, userSub] = await Promise.all([
                        fetchProfile(session.user.id, session.user.email),
                        fetchSubscription(session.user.id),
                    ]);
                    setProfile(userProfile);
                    setSubscription(userSub);
                } else {
                    setProfile(null);
                    setSubscription(null);
                }

                setLoading(false);
            }
        );

        return () => authSub.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        window.location.href = '/login';
    };

    const isAdmin = profile?.role === 'admin';
    const isOwner = profile?.role === 'owner';
    const isStaff = profile?.role === 'staff';
    const hasActivePlan = subscription !== null && ['active', 'trialing'].includes(subscription.status);

    const value = {
        user,
        session,
        profile,
        subscription,
        loading,
        isAdmin,
        isOwner,
        isStaff,
        hasActivePlan,
        signOut,
        refreshProfile,
        refreshSubscription,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
