/**
 * Verification Email Test Script
 * 
 * This script can be run in the browser console to test email sending
 * Run this on: https://www.blinno.app/verify-email or http://localhost:5173/verify-email
 */

// Test 1: Check if user has unverified email
async function testEmailStatus() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user) {
    console.log("❌ No user session found. Please sign up first.");
    return;
  }
  
  console.log("📧 Email Status:");
  console.log("Email:", session.user.email);
  console.log("Verified:", session.user.email_confirmed_at ? "✅ Yes" : "❌ No");
  console.log("Confirmation sent at:", session.user.confirmation_sent_at);
  
  return {
    email: session.user.email,
    verified: !!session.user.email_confirmed_at,
    confirmationSentAt: session.user.confirmation_sent_at
  };
}

// Test 2: Resend verification email
async function testResendEmail() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user?.email) {
    console.log("❌ No email found in session");
    return;
  }
  
  console.log("📤 Resending verification email to:", session.user.email);
  
  const { data, error } = await supabase.auth.resend({
    type: "signup",
    email: session.user.email,
    options: {
      emailRedirectTo: `${window.location.origin}/verify-email?verified=true`,
    },
  });
  
  if (error) {
    console.error("❌ Error resending email:", error);
    return { success: false, error: error.message };
  }
  
  console.log("✅ Email resend request successful:", data);
  return { success: true, data };
}

// Test 3: Check Supabase email configuration
async function testEmailConfig() {
  // Check if we can access Supabase client
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.log("❌ No session - cannot test config");
    return;
  }
  
  console.log("⚙️ Email Configuration Check:");
  console.log("Supabase URL:", supabase.supabaseUrl);
  console.log("Redirect URL:", `${window.location.origin}/verify-email?verified=true`);
  console.log("Current origin:", window.location.origin);
  
  // Try to get user metadata
  const user = session.user;
  console.log("User metadata:", user.user_metadata);
  console.log("App metadata:", user.app_metadata);
  
  return {
    supabaseUrl: supabase.supabaseUrl,
    redirectUrl: `${window.location.origin}/verify-email?verified=true`,
    origin: window.location.origin
  };
}

// Test 4: Simulate signup (requires form data)
async function testSignupFlow(testEmail, testPassword, testName) {
  console.log("🧪 Testing signup flow...");
  console.log("Email:", testEmail);
  console.log("Name:", testName);
  
  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      emailRedirectTo: `${window.location.origin}/verify-email?verified=true`,
      data: {
        full_name: testName,
        intended_role: "buyer",
      },
    },
  });
  
  if (error) {
    console.error("❌ Signup error:", error);
    return { success: false, error: error.message };
  }
  
  console.log("✅ Signup successful!");
  console.log("User ID:", data.user?.id);
  console.log("Email sent:", data.user ? "Yes" : "No");
  console.log("Session:", data.session ? "Created" : "Not created (email verification required)");
  
  return {
    success: true,
    userId: data.user?.id,
    emailSent: !!data.user,
    sessionCreated: !!data.session
  };
}

// Export test functions
window.testEmailStatus = testEmailStatus;
window.testResendEmail = testResendEmail;
window.testEmailConfig = testEmailConfig;
window.testSignupFlow = testSignupFlow;

console.log(`
📧 Verification Email Test Functions Loaded!

Available functions:
1. testEmailStatus() - Check current email verification status
2. testResendEmail() - Resend verification email
3. testEmailConfig() - Check email configuration
4. testSignupFlow(email, password, name) - Test signup flow

Usage:
- Open browser console on verify-email page
- Run: await testEmailStatus()
- Run: await testResendEmail()
- Run: await testEmailConfig()
- Run: await testSignupFlow("test@example.com", "TestPass123!", "Test User")
`);

