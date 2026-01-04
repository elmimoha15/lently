import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/lib/firebase/auth-context';
import { checkUserExists, initializeUser } from '@/lib/api/users';

export default function SignUp() {
  const navigate = useNavigate();
  const { signInWithGoogle, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true);
      console.log('🔵 Step 1: Starting Google sign-up...');
      
      // Step 1: Authenticate with Google
      await signInWithGoogle();
      console.log('✅ Step 1: Google authentication successful');
      
      // Wait a bit for auth state to settle
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('🔵 Step 2: Checking if user exists in backend...');
      
      // Step 2: Check if user already exists in backend
      const userExists = await checkUserExists();
      console.log('✅ Step 2: User exists check complete:', userExists);
      
      if (userExists) {
        // User already has an account - sign them out and show error
        console.log('❌ User already exists, signing out...');
        await signOut();
        toast.error('Account already exists. Please sign in instead.');
        setIsLoading(false);
        return;
      }
      
      console.log('🔵 Step 3: Creating user in backend...');
      // Step 3: Create user in backend
      await initializeUser();
      console.log('✅ Step 3: User created successfully');
      toast.success('Account created successfully!');
      
      console.log('🔵 Step 4: Redirecting to onboarding...');
      // Step 4: Redirect to new onboarding flow
      navigate('/onboarding/choose-plan');
      console.log('✅ Step 4: Navigation called');
      
    } catch (error: any) {
      console.error('❌ Sign-up error:', error);
      toast.error(error.message || 'Failed to create account');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card variant="glass" className="border-border/50">
          <CardHeader className="text-center pb-2">
            <Logo className="justify-center mb-4" />
            <h1 className="text-2xl font-bold text-foreground">Create Your Account</h1>
            <p className="text-muted-foreground">Start analyzing your YouTube comments</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Google Sign Up */}
            <Button
              variant="outline"
              className="w-full h-12 bg-card hover:bg-card-hover"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            {/* Sign In Link */}
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/signin" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
