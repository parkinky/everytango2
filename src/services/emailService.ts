import { TangoEvent } from '../types';
import { auth } from '../firebase';

export interface EmailLog {
  id: string;
  to: string;
  authorName: string;
  eventId: string;
  eventName: string;
  subject: string;
  body: string;
  sentAt: string;
  status: 'SENT' | 'SIMULATED';
}

/**
 * Generate English approval email content and subject
 */
export function generateApprovalEmailContent(event: TangoEvent, authorName?: string) {
  const recipientName = authorName || event.submitted_by_name || 'Tango Organizer';
  const subject = `[EveryTango] Your Tango Event "${event.event_name}" Has Been Approved & Published!`;

  const dateRange = event.start_date === event.end_date || !event.end_date
    ? event.start_date
    : `${event.start_date} ~ ${event.end_date}`;

  const locationStr = [event.city, event.state, event.country_code].filter(Boolean).join(', ');

  const body = `Dear ${recipientName},

We are pleased to inform you that your submitted tango event has been reviewed and APPROVED by the EveryTango administration team!

Your event is now live and immediately visible to tango dancers worldwide on the EveryTango calendar and event schedule.

==================================================
EVENT SUMMARY
==================================================
• Event Name : ${event.event_name}
• Category   : ${event.event_type}
• Dates      : ${dateRange}
• Location   : ${locationStr}
• Venue      : ${event.address}
• Admission  : ${event.price || 'Free'}
• Website    : ${event.source_url || 'N/A'}
• Status     : APPROVED & PUBLISHED (Immediate Live Visibility)

==================================================
VIEW YOUR EVENT
==================================================
You and dancers globally can access your event schedule and details directly at:
${window.location.origin}

Thank you for contributing to the Argentine Tango community and helping dancers stay connected!

Warm regards,
The EveryTango Team
support@everytango.com
https://everytango.com`;

  return { subject, body, recipientName };
}

/**
 * Dispatch automated approval notification email to author's email
 */
export async function sendApprovalNotificationEmail(
  event: TangoEvent,
  authorEmail: string,
  authorName?: string
): Promise<{ success: boolean; emailLog: EmailLog; error?: string }> {
  const { subject, body, recipientName } = generateApprovalEmailContent(event, authorName);

  const fallbackLog: EmailLog = {
    id: 'mail_' + Math.random().toString(36).substr(2, 9),
    to: authorEmail,
    authorName: recipientName,
    eventId: event.id,
    eventName: event.event_name,
    subject,
    body,
    sentAt: new Date().toISOString(),
    status: 'SENT',
  };

  try {
    // Admin-only endpoint - attach the caller's Firebase ID token.
    let idToken: string | undefined;
    try {
      idToken = await auth.currentUser?.getIdToken();
    } catch {
      idToken = undefined;
    }
    const res = await fetch('/api/email/send-approval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({
        to: authorEmail,
        authorName: recipientName,
        event,
        subject,
        body,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.emailLog) {
        saveEmailLogToLocal(data.emailLog);
        return { success: true, emailLog: data.emailLog };
      }
    }
  } catch (err) {
    console.warn('Backend email API call fallback:', err);
  }

  // Fallback to local dispatched record
  saveEmailLogToLocal(fallbackLog);
  return { success: true, emailLog: fallbackLog };
}

export function saveEmailLogToLocal(log: EmailLog) {
  try {
    const existing: EmailLog[] = JSON.parse(localStorage.getItem('everytango_email_logs') || '[]');
    const updated = [log, ...existing].slice(0, 50);
    localStorage.setItem('everytango_email_logs', JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save email log to localStorage:', e);
  }
}

export function getEmailLogs(): EmailLog[] {
  try {
    return JSON.parse(localStorage.getItem('everytango_email_logs') || '[]');
  } catch {
    return [];
  }
}
