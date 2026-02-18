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
        <div className="min-h-screen bg-[#0f172a] flex relative overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&q=80"
                    alt="Background"
                    className="w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-b sm:bg-gradient-to-r from-gray-900 via-gray-900/95 to-gray-900/70 sm:to-transparent" />
            </div>

            {/* Login Content */}
            <div className="relative z-10 w-full px-4 py-6 sm:p-8 flex flex-col justify-start sm:justify-center min-h-screen overflow-y-auto lg:w-1/2 lg:max-w-xl mx-auto sm:mx-0 sm:max-w-md">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gray-800/50 backdrop-blur-xl p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-700/50 shadow-2xl"
                >
                    <div className="mb-6 sm:mb-10 text-center">
                        <img src="/logotriadak.png" alt="TRIADAK Logo" className="h-28 sm:h-48 lg:h-64 w-auto mx-auto mb-4 sm:mb-6 transition-transform hover:scale-105 duration-500 object-contain drop-shadow-2xl" />
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 tracking-tight">
                            {view === 'signup' ? 'Create your account' : view === 'forgot' ? 'Reset your password' : 'Welcome back'}
                        </h1>
                        <p className="text-gray-400 text-sm sm:text-base">
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
                                                className="w-full bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-xl py-3 sm:py-3.5 pl-11 sm:pl-12 pr-4 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl text-sm sm:text-base transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                                                className="w-full bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-xl py-3 sm:py-3.5 pl-11 sm:pl-12 pr-4 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                                                className="w-full bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-xl py-3 sm:py-3.5 pl-11 sm:pl-12 pr-12 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl text-sm sm:text-base transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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

            {/* Right side slogan (visible on desktop) */}
            <div className="hidden lg:flex flex-col justify-center p-16 relative z-10 w-1/2 text-right">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h2 className="text-6xl font-extrabold text-white leading-tight mb-6 drop-shadow-lg">
                        Manage properties<br />
                        <span className="text-blue-500">at lightspeed.</span>
                    </h2>
                    <p className="text-xl text-gray-300 max-w-lg ml-auto drop-shadow-md">
                        Automate bookings, finances, and guest experiences with the power of our advanced ERP.
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
