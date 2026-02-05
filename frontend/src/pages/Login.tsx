
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
// import { useNavigate } from 'react-router-dom';

const Login = () => {
    // const navigate = useNavigate();

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard`, // Redirect to dashboard after login
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error('Error logging in:', error);
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
                    <div className="mb-10">
                        <div className="h-12 w-12 bg-blue-600 rounded-xl mb-6 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="text-2xl font-bold text-white">T</span>
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Welcome to TRIADA</h1>
                        <p className="text-gray-400 text-lg">The intelligent platform for modern property management.</p>
                    </div>

                    <div className="space-y-6">
                        <button
                            onClick={handleGoogleLogin}
                            className="group w-full bg-white text-gray-900 hover:bg-gray-50 font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-4 transition-all duration-200 shadow-xl0 hover:shadow-2xl transform hover:-translate-y-0.5"
                        >
                            <img
                                src="https://www.svgrepo.com/show/475656/google-color.svg"
                                alt="Google"
                                className="w-6 h-6 transition-transform group-hover:scale-110"
                            />
                            <span className="text-lg">Continue with Google</span>
                        </button>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-gray-700"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">Secured by Enterprise Auth</span>
                            <div className="flex-grow border-t border-gray-700"></div>
                        </div>
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
