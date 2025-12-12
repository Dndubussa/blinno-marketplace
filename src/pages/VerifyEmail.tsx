import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, CheckCircle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getAuthRedirectPath } from "@/lib/authRedirect";
import blinnoLogo from "@/assets/blinno-logo.png";

export default function VerifyEmail() {
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [userEmail, setUserEmail] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { toast } = useToast();
  const { roles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check URL params for verified=true (when coming from email link)
  const searchParams = new URLSearchParams(location.search);
  const isVerifiedFromUrl = searchParams.get("verified") === "true";
  
  // Get email and role from location state or session
  const emailFromState = location.state?.email || "";
  const role = location.state?.role;

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Get email from session if not in state
  useEffect(() => {
    const getEmailFromSession = async () => {
      if (!emailFromState) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setUserEmail(session.user.email);
        }
      } else {
        setUserEmail(emailFromState);
      }
    };
    
    getEmailFromSession();
  }, [emailFromState]);

  // Check if user is already verified (from URL or session)
  useEffect(() => {
    const checkVerificationStatus = async () => {
      // If verified=true in URL, user just clicked email link
      if (isVerifiedFromUrl) {
        // Wait a bit for Supabase to process the hash tokens
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsVerified(true);
          if (!userEmail && session.user.email) {
            setUserEmail(session.user.email);
          }
          
          // Clean URL (remove hash and query params after processing)
          window.history.replaceState({}, '', '/verify-email');
          
          toast({
            title: "Email verified!",
            description: "Your email has been successfully verified. Redirecting you now...",
          });
        } else {
          // If no session yet, wait a bit more and retry
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession?.user) {
              setIsVerified(true);
              if (!userEmail && retrySession.user.email) {
                setUserEmail(retrySession.user.email);
              }
              window.history.replaceState({}, '', '/verify-email');
              toast({
                title: "Email verified!",
                description: "Your email has been successfully verified. Redirecting you now...",
              });
            }
          }, 1000);
        }
      }
    };
    
    checkVerificationStatus();
  }, [isVerifiedFromUrl, toast, userEmail]);

  // Redirect if no email and not verified from URL
  useEffect(() => {
    if (!emailFromState && !isVerifiedFromUrl && !userEmail) {
      // Try to get email from session one more time
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session?.user?.email) {
          navigate("/auth");
        }
      });
    }
  }, [emailFromState, isVerifiedFromUrl, userEmail, navigate]);

  // Listen for auth state changes (when user clicks email link)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          setIsVerified(true);
          if (!userEmail && session.user?.email) {
            setUserEmail(session.user.email);
          }
          
          // Clean URL (remove hash after processing)
          if (window.location.hash) {
            window.history.replaceState({}, '', '/verify-email?verified=true');
          }
          
          toast({
            title: "Email verified!",
            description: "Your email has been successfully verified. Redirecting you now...",
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [toast, userEmail]);

  const handleResend = async () => {
    setIsResending(true);
    
    const emailToUse = userEmail || emailFromState;
    if (!emailToUse) {
      toast({
        title: "Error",
        description: "Email address not found. Please sign up again.",
        variant: "destructive",
      });
      setIsResending(false);
      navigate("/auth");
      return;
    }
    
    // Check if user is already verified before resending
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email_confirmed_at) {
      toast({
        title: "Already Verified",
        description: "Your email is already verified. Redirecting...",
      });
      setIsResending(false);
      // Redirect based on role
      setTimeout(() => {
        if (role === "seller") {
          navigate("/onboarding", { state: { role } });
        } else {
          navigate("/buyer");
        }
      }, 2000);
      return;
    }
    
    const { error, data } = await supabase.auth.resend({
      type: "signup",
      email: emailToUse,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email?verified=true`,
      },
    });

    if (error) {
      console.error("Resend error:", error);
      
      // Handle specific error cases
      let errorMessage = error.message;
      if (error.message.includes('already verified') || error.message.includes('already confirmed')) {
        errorMessage = "Your email is already verified. Redirecting...";
        setTimeout(() => {
          if (role === "seller") {
            navigate("/onboarding", { state: { role } });
          } else {
            navigate("/buyer");
          }
        }, 2000);
      } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
        errorMessage = "Please wait a moment before requesting another email.";
      } else if (error.message.includes('email') || error.message.includes('535')) {
        errorMessage = "Failed to send email. Please check your email configuration or try again later.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      setCountdown(60);
      toast({
        title: "Email sent",
        description: "A new verification link has been sent to your email. Please check your inbox and spam folder.",
      });
    }
    setIsResending(false);
  };

  // Function to determine and execute redirect based on user role
  const redirectToDashboard = useCallback(async () => {
    if (isRedirecting) return; // Prevent multiple redirects
    
    setIsRedirecting(true);
    
    // Ensure user is signed in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast({
        title: "Error",
        description: "Please sign in to continue.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    // Get user role from state, database, or user metadata
    let userRole = role;
    
    if (!userRole) {
      // First, try to get role from database
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      
      if (roles && roles.length > 0) {
        // Prioritize seller role if user has multiple roles
        const hasSeller = roles.some(r => r.role === "seller");
        const hasBuyer = roles.some(r => r.role === "buyer");
        
        if (hasSeller) {
          userRole = "seller";
        } else if (hasBuyer) {
          userRole = "buyer";
        } else {
          // Use first role if neither seller nor buyer
          userRole = roles[0].role;
        }
      }
      
      // If no role found in database, check user metadata (for new signups)
      if (!userRole && session.user.user_metadata?.intended_role) {
        userRole = session.user.user_metadata.intended_role;
      }
    }
    
    // Redirect based on role (consistent across all entry points)
    if (userRole === "seller") {
      // New sellers should go to onboarding first, not directly to dashboard
      navigate("/onboarding", { state: { role: "seller" } });
    } else if (userRole === "buyer") {
      navigate("/buyer");
    } else {
      // Default: use auth redirect utility to determine correct path
      const redirectPath = getAuthRedirectPath(roles);
      navigate(redirectPath);
    }
  }, [isRedirecting, role, navigate, toast]);

  // Auto-redirect after verification (show success message for 2 seconds)
  useEffect(() => {
    if (isVerified && !isRedirecting) {
      const redirectTimer = setTimeout(() => {
        redirectToDashboard();
      }, 2000); // 2 second delay to show success message

      return () => clearTimeout(redirectTimer);
    }
  }, [isVerified, isRedirecting, redirectToDashboard]);

  const handleContinue = () => {
    redirectToDashboard();
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <img src={blinnoLogo} alt="Blinno" className="h-12 w-auto" />
          </div>

          {isVerified ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </motion.div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Email Verified!</h1>
                <p className="text-muted-foreground mb-4">
                  Your email has been successfully verified. You're now signed in!
                </p>
                {isRedirecting ? (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Redirecting to your dashboard...</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Redirecting you automatically in a moment...
                  </p>
                )}
              </div>
              <Button 
                className="w-full" 
                onClick={handleContinue}
                disabled={isRedirecting}
              >
                {isRedirecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  "Continue Now"
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-center mb-2 text-foreground">
                Verify your email
              </h1>
              <p className="text-muted-foreground text-center mb-2">
                We've sent a verification link to
              </p>
              <p className="text-foreground font-medium text-center mb-6">
                {userEmail || emailFromState}
              </p>

              <div className="bg-muted/50 rounded-xl p-4 mb-6">
                <p className="text-sm text-muted-foreground text-center">
                  Click the button in the email we sent you to verify your account. 
                  The link will expire in 24 hours.
                </p>
              </div>

              <div className="text-center space-y-4">
                <p className="text-muted-foreground text-sm">
                  Didn't receive the email?
                </p>
                <Button
                  variant="outline"
                  onClick={handleResend}
                  disabled={isResending || countdown > 0}
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : countdown > 0 ? (
                    `Resend in ${countdown}s`
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-border text-center">
                <button
                  type="button"
                  onClick={() => navigate("/auth")}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Back to Sign In
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
