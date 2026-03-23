import React, { useEffect, useRef, useState } from 'react';

const SCRIPT_SELECTOR = 'script[data-google-gsi="true"]';

const GoogleAuthButton = ({ context = 'signin', onCredential }) => {
  const buttonRef = useRef(null);
  const [localError, setLocalError] = useState('');
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      setLocalError('Set REACT_APP_GOOGLE_CLIENT_ID to enable Google sign-in.');
      return undefined;
    }

    let cancelled = false;

    const renderButton = () => {
      if (cancelled || !window.google?.accounts?.id || !buttonRef.current) {
        return;
      }

      buttonRef.current.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (!response.credential) {
            setLocalError('Google sign-in did not return a credential.');
            return;
          }

          const result = await onCredential(response.credential);
          if (result?.success === false) {
            setLocalError(result.error || 'Google authentication failed.');
          } else {
            setLocalError('');
          }
        },
        context,
        ux_mode: 'popup',
        auto_select: false,
        cancel_on_tap_outside: true
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: buttonRef.current.offsetWidth || 320
      });
    };

    if (window.google?.accounts?.id) {
      renderButton();
      return () => {
        cancelled = true;
      };
    }

    let script = document.querySelector(SCRIPT_SELECTOR);
    const handleLoad = () => renderButton();

    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleGsi = 'true';
      script.addEventListener('load', handleLoad);
      document.body.appendChild(script);
    } else {
      script.addEventListener('load', handleLoad);
    }

    return () => {
      cancelled = true;
      script?.removeEventListener('load', handleLoad);
    };
  }, [clientId, context, onCredential]);

  return (
    <div className="auth-google-block">
      <div className="auth-divider">
        <span>or continue with</span>
      </div>
      <div ref={buttonRef} className="auth-google-render" />
      {localError && <small className="error-text auth-google-help">{localError}</small>}
    </div>
  );
};

export default GoogleAuthButton;
