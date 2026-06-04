import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';

type AuthView = 'signin' | 'signup' | 'forgot';

const Login = () => {
    const [view, setView] = useState<AuthView>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard`,
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error logging in:', error);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/dashboard`,
            });
            if (error) throw error;
            setMessage('Password reset email sent! Check your inbox and click the link to set a new password.');
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (view === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/pricing`,
                    },
                });
                if (error) throw error;
                setMessage('We sent you a verification email. Please check your inbox and click the confirmation link to get started.');
            } else {
                const { error, data } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;

                // Check user role to redirect accordingly
                if (data.user) {
                    // Small delay to ensure profile trigger has fired
                    await new Promise(resolve => setTimeout(resolve, 500));

                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('user_id', data.user.id)
                        .single();

                    // Redirect based on role
                    const roleAssigned = localStorage.getItem(`triadak_role_assigned_${data.user.id}`);
                    if (profileData?.role === 'owner' && roleAssigned) {
                        window.location.href = '/portal/dashboard';
                    } else if (profileData?.role === 'worker') {
                        window.location.href = '/worker/tasks';
                    } else {
                        window.location.href = '/dashboard';
                    }
                } else {
                    window.location.href = '/dashboard';
                }
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const switchView = (newView: AuthView) => {
        setView(newView);
        setError(null);
        setMessage(null);
    };

    return (
        <div className="min-h-screen flex bg-background">
            <div className="hidden lg:flex lg:w-1/2 border-r border-border bg-card items-center justify-center p-12">
                <div className="max-w-md">
                    <img src="/logotriadak.png" alt="TRIADAK" className="h-32 w-auto mb-8 object-contain" />
                    <h2 className="text-display mb-3">Gestión profesional de alquiler vacacional</h2>
                    <p className="text-subtitle">
                        Propiedades, reservas, finanzas y equipo en una sola plataforma.
                    </p>
                </div>
            </div>

            <div className="flex w-full flex-col justify-center px-4 py-8 sm:px-8 lg:w-1/2 lg:max-w-lg lg:mx-auto min-h-screen">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="surface-card p-6 sm:p-8 shadow-sm"
                >
                    <div className="mb-8 text-center lg:hidden">
                        <img src="/logotriadak.png" alt="TRIADAK Logo" className="mx-auto mb-6 h-24 w-auto object-contain sm:h-32" />
                    </div>
                    <div className="mb-6 sm:mb-8 text-center lg:text-left">
                        <h1 className="text-display mb-2">
                            {view === 'signup' ? 'Create your account' : view === 'forgot' ? 'Reset your password' : 'Welcome back'}
                        </h1>
                        <p className="text-subtitle">
                            {view === 'signup'
                                ? 'Start managing your properties today'
                                : view === 'forgot'
                                    ? 'Enter your email and we\'ll send you a reset link'
                                    : 'Sign in to continue to TRIADAK'}
                        </p>
                    </div>

                    <div className="space-y-4 sm:space-y-5">
                        {/* Forgot Password Form */}
                        {view === 'forgot' ? (
                            <>
                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 sm:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="you@example.com"
                                                required
                                                className="input-field pl-11 sm:pl-12 py-3 sm:py-3.5"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm">{error}</div>
                                    )}
                                    {message && (
                                        <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm">{message}</div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary w-full py-3 sm:py-3.5"
                                    >
                                        {loading ? 'Sending...' : 'Send Reset Link'}
                                    </button>
                                </form>

                                <button
                                    onClick={() => switchView('signin')}
                                    className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors w-full"
                                >
                                    <ArrowLeft className="w-4 h-4" /> Back to Sign in
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Google Button */}
                                <button
                                    onClick={handleGoogleLogin}
                                    className="group w-full bg-white text-gray-900 hover:bg-gray-50 font-semibold py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
                                >
                                    <img
                                        src="https://www.svgrepo.com/show/475656/google-color.svg"
                                        alt="Google"
                                        className="w-5 h-5 transition-transform group-hover:scale-110"
                                    />
                                    <span>Continue with Google</span>
                                </button>

                                {/* Divider */}
                                <div className="relative flex py-3 items-center">
                                    <div className="flex-grow border-t border-gray-700"></div>
                                    <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">or</span>
                                    <div className="flex-grow border-t border-gray-700"></div>
                                </div>

                                {/* Email/Password Form */}
                                <form onSubmit={handleEmailAuth} className="space-y-3 sm:space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 sm:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="you@example.com"
                                                required
                                                className="input-field pl-11 sm:pl-12 py-3 sm:py-3.5"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                            <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
                                            {view === 'signin' && (
                                                <button
                                                    type="button"
                                                    onClick={() => switchView('forgot')}
                                                    className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
                                                >
                                                    Forgot password?
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 sm:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                                            <input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                required
                                                minLength={6}
                                                className="input-field pl-11 sm:pl-12 pr-12 py-3 sm:py-3.5"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
                                    )}
                                    {message && (
                                        <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl text-sm">{message}</div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary w-full py-3 sm:py-3.5"
                                    >
                                        {loading ? 'Loading...' : view === 'signup' ? 'Sign up' : 'Sign in'}
                                    </button>
                                </form>

                                {/* Toggle Sign Up / Sign In */}
                                <p className="text-center text-gray-400 text-sm mt-4 sm:mt-6">
                                    {view === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                                    <button
                                        onClick={() => switchView(view === 'signup' ? 'signin' : 'signup')}
                                        className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
                                    >
                                        {view === 'signup' ? 'Sign in' : 'Sign up'}
                                    </button>
                                </p>
                            </>
                        )}
                    </div>
                </motion.div>

                <div className="mt-4 sm:mt-8 text-center pb-4 sm:pb-0 space-y-1">
                    <p className="text-gray-500 text-xs sm:text-sm">
                        &copy; {new Date().getFullYear()} TRIADAK. All rights reserved.
                    </p>
                    <p className="text-gray-600 text-xs sm:text-sm">
                        Developed by{' '}
                        <a href="https://zirox.io" target="_blank" rel="noopener noreferrer" className="text-blue-500/70 hover:text-blue-400 transition-colors">
                            zirox.io
                        </a>
                    </p>
                </div>
            </div>

        </div>
    );
};

export default Login;
