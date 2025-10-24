/**
 * Sentry Configuration
 * Crash monitoring and error tracking
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENVIRONMENT = import.meta.env.MODE || 'development';

/**
 * Initialize Sentry for error tracking
 */
export const initSentry = () => {
  // Only initialize if DSN is provided and not in development
  if (!SENTRY_DSN) {
    console.log('[Sentry] DSN not configured, skipping initialization');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENVIRONMENT,
      integrations: [
        new BrowserTracing(),
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      
      // Performance Monitoring
      tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1.0,
      
      // Session Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      
      // Release tracking
      release: `motofreela@${import.meta.env.VITE_APP_VERSION || '0.0.0'}`,
      
      // Filter out sensitive data
      beforeSend(event, hint) {
        // Don't send events in development
        if (ENVIRONMENT === 'development') {
          console.log('[Sentry] Event captured (dev mode):', event);
          return null;
        }

        // Remove sensitive data from breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
            if (breadcrumb.data) {
              // Remove tokens and passwords
              const sanitized = { ...breadcrumb.data };
              delete sanitized.token;
              delete sanitized.password;
              delete sanitized.access_token;
              delete sanitized.refresh_token;
              return { ...breadcrumb, data: sanitized };
            }
            return breadcrumb;
          });
        }

        return event;
      },
      
      // Ignore certain errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'chrome-extension://',
        'moz-extension://',
        // Network errors that are expected
        'NetworkError',
        'Failed to fetch',
        'Load failed',
        // User cancelled actions
        'AbortError',
        'cancelled',
      ],
    });

    console.log('[Sentry] Initialized successfully');
  } catch (error) {
    console.error('[Sentry] Initialization failed:', error);
  }
};

/**
 * Capture exception with context
 */
export const captureException = (
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: Sentry.SeverityLevel;
  }
) => {
  if (ENVIRONMENT === 'development') {
    console.error('[Sentry] Exception (dev mode):', error, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (context?.level) {
      scope.setLevel(context.level);
    }

    Sentry.captureException(error);
  });
};

/**
 * Capture message with context
 */
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) => {
  if (ENVIRONMENT === 'development') {
    console.log(`[Sentry] Message (dev mode) [${level}]:`, message, context);
    return;
  }

  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, any>,
  level: Sentry.SeverityLevel = 'info'
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
};

/**
 * Set user context
 */
export const setUser = (user: {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}) => {
  Sentry.setUser(user);
};

/**
 * Clear user context
 */
export const clearUser = () => {
  Sentry.setUser(null);
};

/**
 * Start a transaction for performance monitoring
 */
export const startTransaction = (name: string, op: string) => {
  return Sentry.startTransaction({
    name,
    op,
  });
};
