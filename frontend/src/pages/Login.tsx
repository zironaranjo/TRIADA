
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
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-700"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome to TRIADA</h1>
                    <p className="text-gray-400">Sign in to manage your properties</p>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-white text-gray-900 border border-gray-300 hover:bg-gray-100 font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-colors"
                >
                    <img
                        src="https://www.svgrepo.com/show/475656/google-color.svg"
                        alt="Google"
                        className="w-6 h-6"
                    />
                    Sign in with Google
                </button>
            </motion.div>
        </div>
    );
};

export default Login;
