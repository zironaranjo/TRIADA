import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

const Login = () => {
    const [isSignUp, setIsSignUp] = useState(false);
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

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isSignUp) {
                // Sign Up
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/dashboard`,
                    },
                });
                if (error) throw error;
                setMessage('Check your email for the confirmation link!');
            } else {
                // Sign In
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                window.location.href = '/dashboard';
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex relative overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&q=80"
                    alt="Background"
                    className="w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/90 to-transparent" />
            </div>

            {/* Login Content */}
            <div className="relative z-10 w-full max-w-md p-8 flex flex-col justify-center min-h-screen lg:w-1/2 lg:max-w-xl">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gray-800/50 backdrop-blur-xl p-8 rounded-3xl border border-gray-700/50 shadow-2xl"
                >
                    <div className="mb-10 text-center">
                        <img src="/logotriadak.png" alt="TRIADA Logo" className="h-32 w-auto mx-auto mb-6 transition-transform hover:scale-105 duration-500" />
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                            {isSignUp ? 'Create your account' : 'Welcome back'}
                        </h1>
                        <p className="text-gray-400">
                            {isSignUp
                                ? 'Start managing your properties today'
                                : 'Sign in to continue to TRIADA'}
                        </p>
                    </div>

                    <div className="space-y-5">
                        {/* Google Button */}
                        <button
                            onClick={handleGoogleLogin}
                            className="group w-full bg-white text-gray-900 hover:bg-gray-50 font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
                        <form onSubmit={handleEmailAuth} className="space-y-4">
                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                        className="w-full bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        minLength={6}
                                        className="w-full bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-xl py-3.5 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Success Message */}
                            {message && (
                                <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-xl text-sm">
                                    {message}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? 'Loading...' : isSignUp ? 'Sign up' : 'Sign in'}
                            </button>
                        </form>

                        {/* Toggle Sign Up / Sign In */}
                        <p className="text-center text-gray-400 text-sm mt-6">
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                            <button
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setError(null);
                                    setMessage(null);
                                }}
                                className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
                            >
                                {isSignUp ? 'Sign in' : 'Sign up'}
                            </button>
                        </p>
                    </div>
                </motion.div>

                <p className="mt-8 text-center text-gray-500 text-sm">
                    &copy; 2026 TRIADA Systems. All rights reserved.
                </p>
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
