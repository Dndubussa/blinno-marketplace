import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ArrowLeft, Mail, Lock, User, ShoppingBag, Store, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { parseSignupError, type AccountExistenceError } from "@/lib/accountValidation";
import { getPostLoginRedirectPath } from "@/lib/authRedirect";
import { validatePassword } from "@/lib/passwordValidation";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";
import blinnoLogo from "@/assets/blinno-logo.png";

const signUpSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100)
    .refine(
      (password) => {
        const result = validatePassword(password);
        return result.isValid;
      },
      (password) => {
        const result = validatePassword(password);
        return { message: result.errors.join(". ") };
      }
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  role: z.enum(["buyer", "seller"], { required_error: "Please select a role" }),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the Terms of Service",
  }),
  acceptPrivacy: z.boolean().refine((val) => val === true, {
    message: "You must accept the Privacy Policy",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(1, "Password is required").max(100),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
});

type SignUpFormData = z.infer<typeof signUpSchema>;
type SignInFormData = z.infer<typeof signInSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;


type AuthView = "signIn" | "signUp" | "forgotPassword";

export default function Auth() {
  const [view, setView] = useState<AuthView>("signIn");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<AccountExistenceError | null>(null);
  const { signUp, signIn, user, loading, roles } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user && user.id) {
      // Ensure roles is an array before calling
      if (roles && Array.isArray(roles) && roles.length > 0) {
        getPostLoginRedirectPath(user.id, roles, location.state?.from?.pathname).then((redirectPath) => {
          navigate(redirectPath, { replace: true });
        }).catch((error) => {
          console.error("Error getting redirect path:", error);
          // Fallback to default redirect
          navigate("/products", { replace: true });
        });
      }
    }
  }, [user, loading, roles, navigate, location.state]);

  // Clear account error when switching views
  useEffect(() => {
    setAccountError(null);
  }, [view]);

  const signUpForm = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: undefined,
      acceptTerms: false,
      acceptPrivacy: false,
    },
  });

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const watchedPassword = signUpForm.watch("password");
  const selectedRole = signUpForm.watch("role");

  const handleSignUp = async (data: SignUpFormData) => {
    setIsLoading(true);
    setAccountError(null);
    
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email?verified=true`,
        data: {
          full_name: data.fullName,
          intended_role: data.role || "buyer", // Store intended role in metadata
        },
      },
    });

    if (error) {
      // Check for account existence error
      const accountExistenceError = parseSignupError(error);
      
      if (accountExistenceError) {
        setAccountError(accountExistenceError);
        toast({
          title: "Account already exists",
          description: accountExistenceError.userMessage,
          variant: "destructive",
        });
      } else {
        // Handle other errors
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      setAccountError(null);
      toast({
        title: "Check your email",
        description: "We've sent you a verification link. Click it to verify your account.",
      });
      navigate("/verify-email", { state: { email: data.email, role: data.role } });
    }
    setIsLoading(false);
  };

  const [justSignedIn, setJustSignedIn] = useState(false);

  // Handle redirect after successful sign in (once roles are loaded)
  useEffect(() => {
    if (justSignedIn && !loading && user && user.id) {
      // Wait for roles to be loaded (with timeout to prevent infinite wait)
      if (roles && Array.isArray(roles) && roles.length > 0) {
        getPostLoginRedirectPath(user.id, roles, location.state?.from?.pathname).then((redirectPath) => {
          toast({
            title: "Welcome back!",
            description: "You have signed in successfully.",
          });
          navigate(redirectPath, { replace: true });
          setJustSignedIn(false);
        }).catch((error) => {
          console.error("Error getting redirect path:", error);
          // Fallback to default redirect
          navigate("/products", { replace: true });
          setJustSignedIn(false);
        });
      } else {
        // If roles are not loaded yet, wait a bit and check again
        const timeout = setTimeout(() => {
          if (roles && Array.isArray(roles) && roles.length > 0) {
            getPostLoginRedirectPath(user.id, roles, location.state?.from?.pathname).then((redirectPath) => {
              toast({
                title: "Welcome back!",
                description: "You have signed in successfully.",
              });
              navigate(redirectPath, { replace: true });
              setJustSignedIn(false);
            }).catch((error) => {
              console.error("Error getting redirect path:", error);
              navigate("/products", { replace: true });
              setJustSignedIn(false);
            });
          } else {
            // If still no roles after timeout, redirect to products
            console.warn("Roles not loaded after sign-in, redirecting to products");
            navigate("/products", { replace: true });
            setJustSignedIn(false);
          }
        }, 2000); // Wait 2 seconds for roles to load

        return () => clearTimeout(timeout);
      }
    }
  }, [justSignedIn, loading, user, roles, navigate, location.state, toast]);

  const handleSignIn = async (data: SignInFormData) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);

    if (error) {
      let message = error.message;
      if (message.includes("Invalid login credentials")) {
        message = "Invalid email or password. Please try again.";
      }
      toast({
        title: "Sign in failed",
        description: message,
        variant: "destructive",
      });
      setIsLoading(false);
    } else {
      // Mark that we just signed in - useEffect will handle redirect once roles load
      setJustSignedIn(true);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
      setView("signIn");
    }
    setIsLoading(false);
  };

  const handleSocialLogin = async (provider: "google" | "apple") => {
    setSocialLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/onboarding`,
      },
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setSocialLoading(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Back to Home */}
        <Button
          variant="ghost"
          className="mb-6 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        {/* Auth Card */}
        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <img src={blinnoLogo} alt="Blinno" className="h-12 w-auto" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center mb-2 text-foreground">
            {view === "signUp" ? "Create your account" : view === "forgotPassword" ? "Reset your password" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            {view === "signUp"
              ? "Start selling or shopping on Blinno"
              : view === "forgotPassword"
              ? "Enter your email to receive a reset link"
              : "Sign in to continue to your account"}
          </p>

          {/* Social Login Buttons */}
          {view !== "forgotPassword" && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSocialLogin("google")}
                  disabled={socialLoading !== null}
                >
                  {socialLoading === "google" ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground" />
                  ) : (
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleSocialLogin("apple")}
                  disabled={socialLoading !== null}
                >
                  {socialLoading === "apple" ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground" />
                  ) : (
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                  )}
                  Apple
                </Button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>
            </>
          )}

          {/* Forms */}
          {view === "signUp" ? (
            <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
              {/* Account Existence Error Alert */}
              {accountError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Account Already Exists</AlertTitle>
                  <AlertDescription className="mt-2 space-y-3">
                    <p>{accountError.userMessage}</p>
                    <div className="flex flex-wrap gap-2">
                      {accountError.actions.signIn && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAccountError(null);
                            setView("signIn");
                            signInForm.setValue("email", signUpForm.getValues("email"));
                          }}
                          className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          Sign In Instead
                        </Button>
                      )}
                      {accountError.actions.resetPassword && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const email = signUpForm.getValues("email");
                            setAccountError(null);
                            setView("forgotPassword");
                            forgotPasswordForm.setValue("email", email);
                            toast({
                              title: "Password Reset",
                              description: "You can reset your password on the next screen.",
                            });
                          }}
                          className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          Reset Password
                        </Button>
                      )}
                      {accountError.actions.resendVerification && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const email = signUpForm.getValues("email");
                            const { error } = await supabase.auth.resend({
                              type: 'signup',
                              email: email,
                              options: {
                                emailRedirectTo: `${window.location.origin}/verify-email?verified=true`,
                              },
                            });
                            
                            if (error) {
                              toast({
                                title: "Error",
                                description: error.message,
                                variant: "destructive",
                              });
                            } else {
                              setAccountError(null);
                              toast({
                                title: "Verification email sent",
                                description: "Please check your email for the verification link.",
                              });
                            }
                          }}
                          className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          Resend Verification Email
                        </Button>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Role Selection */}
              <div className="space-y-2">
                <Label className="text-foreground">I want to</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => signUpForm.setValue("role", "buyer")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      selectedRole === "buyer"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <ShoppingBag className={`h-6 w-6 ${selectedRole === "buyer" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`font-medium ${selectedRole === "buyer" ? "text-primary" : "text-foreground"}`}>
                      Buy
                    </span>
                    <span className="text-xs text-muted-foreground">Shop products</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => signUpForm.setValue("role", "seller")}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      selectedRole === "seller"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <Store className={`h-6 w-6 ${selectedRole === "seller" ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`font-medium ${selectedRole === "seller" ? "text-primary" : "text-foreground"}`}>
                      Sell
                    </span>
                    <span className="text-xs text-muted-foreground">List products</span>
                  </button>
                </div>
                {signUpForm.formState.errors.role && (
                  <p className="text-sm text-destructive">
                    {signUpForm.formState.errors.role.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    placeholder="Enter your full name"
                    className="pl-10 bg-white"
                    {...signUpForm.register("fullName")}
                  />
                </div>
                {signUpForm.formState.errors.fullName && (
                  <p className="text-sm text-destructive">
                    {signUpForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    className="pl-10 bg-white"
                    {...signUpForm.register("email")}
                  />
                </div>
                {signUpForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {signUpForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    className="pl-10 pr-10 bg-white"
                    {...signUpForm.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Password Strength Meter */}
                {watchedPassword && (
                  <PasswordStrengthMeter password={watchedPassword} />
                )}
                {signUpForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {signUpForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="pl-10 pr-10 bg-white"
                    {...signUpForm.register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {signUpForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {signUpForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Terms and Privacy */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="acceptTerms"
                    checked={signUpForm.watch("acceptTerms")}
                    onCheckedChange={(checked) => signUpForm.setValue("acceptTerms", checked === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="acceptTerms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                    I agree to the{" "}
                    <a href="/terms" target="_blank" className="text-primary hover:underline">
                      Terms of Service
                    </a>
                  </label>
                </div>
                {signUpForm.formState.errors.acceptTerms && (
                  <p className="text-sm text-destructive">
                    {signUpForm.formState.errors.acceptTerms.message}
                  </p>
                )}

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="acceptPrivacy"
                    checked={signUpForm.watch("acceptPrivacy")}
                    onCheckedChange={(checked) => signUpForm.setValue("acceptPrivacy", checked === true)}
                    className="mt-0.5"
                  />
                  <label htmlFor="acceptPrivacy" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                    I agree to the{" "}
                    <a href="/privacy" target="_blank" className="text-primary hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {signUpForm.formState.errors.acceptPrivacy && (
                  <p className="text-sm text-destructive">
                    {signUpForm.formState.errors.acceptPrivacy.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          ) : view === "forgotPassword" ? (
            <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="Enter your email address"
                    className="pl-10 bg-white"
                    {...forgotPasswordForm.register("email")}
                  />
                </div>
                {forgotPasswordForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {forgotPasswordForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setView("signIn")}
              >
                Back to Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    className="pl-10 bg-white"
                    {...signInForm.register("email")}
                  />
                </div>
                {signInForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {signInForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <button
                    type="button"
                    onClick={() => setView("forgotPassword")}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10 bg-white"
                    {...signInForm.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {signInForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {signInForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          )}

          {/* Toggle */}
          {view !== "forgotPassword" && (
            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                {view === "signUp" ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setView(view === "signUp" ? "signIn" : "signUp")}
                  className="text-primary hover:underline font-medium"
                >
                  {view === "signUp" ? "Sign in" : "Sign up"}
                </button>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
