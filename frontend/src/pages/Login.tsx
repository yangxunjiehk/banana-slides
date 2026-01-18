/**
 * Login page with Google OAuth and Email OTP
 */
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { isAuthEnabled, supabase } from '@/lib/supabase';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isInitialized, isLoading, signInWithGoogle, signInWithMagicLink } =
    useAuthStore();

  // Check for error in URL params
  const errorType = searchParams.get('error');
  const [showError, setShowError] = useState(!!errorType);

  // Email OTP state
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      const from = (location.state as { from?: Location })?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isInitialized, navigate, location]);

  // If auth is not enabled, redirect to home
  useEffect(() => {
    if (!isAuthEnabled) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
  };

  const handleSendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setOtpError('');
    setSuccessMessage('');

    if (!email.trim()) {
      setOtpError('Please enter your email address');
      return;
    }

    const result = await signInWithMagicLink(email.trim());

    if (result.success) {
      setStep('code');
      setSuccessMessage('Verification code sent to your email!');
      setResendCountdown(60);
      // Focus first code input
      setTimeout(() => codeInputRefs.current[0]?.focus(), 100);
    } else {
      setOtpError(result.error || 'Failed to send verification code');
    }
  };

  const handleVerifyCode = async () => {
    const code = verificationCode.join('');
    if (code.length !== 8 || !supabase) return;

    setIsVerifying(true);
    setOtpError('');

    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: 'email'
      });

      if (error) throw error;

      // Verification successful, navigate to callback for whitelist check
      navigate('/auth/callback', { replace: true });
    } catch (err: any) {
      setOtpError('Invalid verification code. Please try again.');
      setVerificationCode(['', '', '', '', '', '', '', '']);
      codeInputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 7) {
      codeInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (value && index === 7 && newCode.every(c => c)) {
      setTimeout(() => handleVerifyCode(), 100);
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8);
    if (pastedData) {
      const newCode = [...verificationCode];
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i];
      }
      setVerificationCode(newCode);
      const focusIndex = Math.min(pastedData.length, 7);
      codeInputRefs.current[focusIndex]?.focus();
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setVerificationCode(['', '', '', '', '', '', '', '']);
    setOtpError('');
    setSuccessMessage('');
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Banana Slides
          </h1>
          <p className="text-gray-600">AI-Powered PPT Generator</p>
        </div>

        {/* Error message for forbidden access */}
        {showError && errorType === 'forbidden' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-red-800 font-medium">Access Denied</p>
                <p className="text-red-600 text-sm mt-1">
                  Your account is not authorized to access this service. Please contact the administrator.
                </p>
              </div>
              <button
                onClick={() => setShowError(false)}
                className="text-red-400 hover:text-red-600 ml-auto"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Error message */}
          {otpError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{otpError}</p>
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-600 text-sm">{successMessage}</p>
            </div>
          )}

          {step === 'email' ? (
            <>
              {/* Email Form */}
              <form onSubmit={handleSendCode} className="space-y-3">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {isLoading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or continue with</span>
                </div>
              </div>

              {/* Google Login */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-gray-700 font-medium">
                  {isLoading ? 'Loading...' : 'Google'}
                </span>
              </button>
            </>
          ) : (
            <>
              {/* Verification Code Input */}
              <div className="text-center text-sm text-gray-600 mb-4">
                Enter the 8-digit code sent to
                <br />
                <span className="font-medium text-gray-800">{email}</span>
              </div>

              {/* 8-digit code input boxes */}
              <div className="flex justify-center gap-2 mb-6" onPaste={handleCodePaste}>
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { codeInputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(index, e)}
                    disabled={isVerifying}
                    className="w-10 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 transition-colors disabled:opacity-50 disabled:bg-gray-50"
                  />
                ))}
              </div>

              {/* Verify button */}
              <button
                onClick={handleVerifyCode}
                disabled={isVerifying || verificationCode.some(c => !c)}
                className="w-full px-4 py-3 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Verifying...
                  </span>
                ) : (
                  'Verify & Sign In'
                )}
              </button>

              {/* Resend and back buttons */}
              <div className="flex justify-between text-sm mt-4">
                <button
                  onClick={handleBackToEmail}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Change Email
                </button>
                <button
                  onClick={() => handleSendCode()}
                  disabled={resendCountdown > 0 || isLoading}
                  className="text-yellow-600 hover:text-yellow-700 disabled:text-gray-400"
                >
                  {resendCountdown > 0 ? `Resend Code (${resendCountdown}s)` : 'Resend Code'}
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          Sign in to save your projects and access them from anywhere
        </p>
      </div>
    </div>
  );
}
