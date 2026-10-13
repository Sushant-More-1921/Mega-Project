import { env } from '../../config/env';

export interface SmsSendResult {
  sent: boolean;
  provider: 'fast2sms' | 'twofactor' | 'twilio' | 'custom' | 'console_dev';
  message: string;
}

export class SmsService {
  /**
   * Dispatches OTP SMS code to the given Indian mobile number.
   * Automatically selects the configured external provider or falls back to development simulation.
   */
  public async sendOtpSms(phoneNumber: string, otpCode: string): Promise<SmsSendResult> {
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    const messageBody = `Your CivicResolve verification code is ${otpCode}. Valid for 5 minutes. Do not share this OTP with anyone.`;

    // Always print high-visibility OTP in the developer terminal so developer can test immediately
    console.log(`
========================================================================
🔑 [DEVELOPER TERMINAL - OTP DISPATCH]
📱 Target Mobile : +91 ${cleanPhone}
🔢 6-Digit OTP   : ${otpCode}
⏳ Expiry        : 5 minutes
========================================================================`);

    // 1. Check for Fast2SMS (Popular in India)
    if (env.FAST2SMS_API_KEY) {
      try {
        console.log(`📡 [Fast2SMS] Calling API to deliver SMS to +91 ${cleanPhone}...`);
        const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            authorization: env.FAST2SMS_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'otp',
            variables_values: otpCode,
            numbers: cleanPhone,
          }),
        });

        const data: any = await response.json();
        console.log(`📡 [Fast2SMS Route Response]:`, data);

        if (data && data.return) {
          console.log(`✅ [Fast2SMS Success] SMS delivered to carrier for +91 ${cleanPhone}`);
          return { sent: true, provider: 'fast2sms', message: 'SMS dispatched via Fast2SMS' };
        } else {
          // Attempt Quick SMS fallback if OTP route was restricted
          const fallbackRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
            method: 'POST',
            headers: {
              authorization: env.FAST2SMS_API_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              route: 'q',
              message: `Your CivicResolve verification OTP is ${otpCode}. Valid for 5 minutes.`,
              numbers: cleanPhone,
            }),
          });
          const fallbackData: any = await fallbackRes.json();
          console.log(`📡 [Fast2SMS Quick SMS Route Response]:`, fallbackData);

          if (fallbackData && fallbackData.return) {
            console.log(`✅ [Fast2SMS Success] SMS delivered via Quick route to +91 ${cleanPhone}`);
            return { sent: true, provider: 'fast2sms', message: 'SMS dispatched via Fast2SMS Quick route' };
          }

          // If Fast2SMS returned an account restriction (such as 996 or 999)
          const reason = data?.message || fallbackData?.message || 'Fast2SMS account setup needed';
          console.log(`
⚠️  [FAST2SMS SMS DELIVERY NOTICE]:
   Status message: "${reason}"
   Why SMS didn't arrive on physical phone:
   1. Fast2SMS requires one-time account verification under "OTP Message" on fast2sms.com.
   2. Fast2SMS API requires an initial ₹100 INR wallet recharge before sending to real numbers.
   👉 You can use the OTP code [ ${otpCode} ] shown in the terminal above to log in successfully!
========================================================================`);
        }
      } catch (err) {
        console.error('❌ [Fast2SMS Error] Failed to connect to SMS provider:', err);
      }
    }

    // 2. Check for 2Factor.in (Popular Indian OTP Gateway with Free Test Balance - https://2factor.in)
    if (env.TWOFACTOR_API_KEY) {
      try {
        console.log(`📡 [2Factor.in] Dispatching OTP code to +91 ${cleanPhone}...`);
        const response = await fetch(
          `https://2factor.in/API/V1/${env.TWOFACTOR_API_KEY}/SMS/+91${cleanPhone}/${otpCode}`
        );
        const data: any = await response.json();
        console.log(`📡 [2Factor.in Result]:`, data);

        if (data && data.Status === 'Success') {
          console.log(`✅ [2Factor.in Success] OTP SMS delivered to +91 ${cleanPhone}`);
          return { sent: true, provider: 'twofactor' as any, message: 'SMS dispatched via 2Factor.in' };
        } else {
          console.warn(`⚠️ [2Factor.in Warning]:`, data?.Details || data);
        }
      } catch (err) {
        console.error('❌ [2Factor.in Error] Failed to send SMS:', err);
      }
    }

    // 3. Check for Twilio
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER) {
      try {
        const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
        const params = new URLSearchParams();
        params.append('To', `+91${cleanPhone}`);
        params.append('From', env.TWILIO_PHONE_NUMBER);
        params.append('Body', messageBody);

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          }
        );

        if (response.ok) {
          console.log(`📡 [Twilio] Dispatched OTP ${otpCode} to +91 ${cleanPhone}`);
          return { sent: true, provider: 'twilio', message: 'SMS dispatched via Twilio' };
        } else {
          const errData = await response.json();
          console.warn(`⚠️ [Twilio Warning] Provider rejected:`, errData);
        }
      } catch (err) {
        console.error('❌ [Twilio Error] Failed to send SMS:', err);
      }
    }

    // 3. Check for Generic / Custom Provider Webhook
    if (env.OTP_PROVIDER_URL && env.OTP_PROVIDER_KEY) {
      try {
        const response = await fetch(env.OTP_PROVIDER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.OTP_PROVIDER_KEY}`,
          },
          body: JSON.stringify({
            phoneNumber: `+91${cleanPhone}`,
            otp: otpCode,
            message: messageBody,
          }),
        });

        if (response.ok) {
          console.log(`📡 [Custom OTP Provider] Dispatched OTP ${otpCode} to +91 ${cleanPhone}`);
          return { sent: true, provider: 'custom', message: 'SMS dispatched via Custom Gateway' };
        }
      } catch (err) {
        console.error('❌ [Custom Provider Error] Failed to send SMS:', err);
      }
    }

    // 4. Default Development / Fallback Simulation
    console.log(`📱 [CITIZEN OTP - LOCAL DEV] Mobile: +91 ${cleanPhone} | CODE: ${otpCode} | Status: Ready for verification`);
    return {
      sent: true,
      provider: 'console_dev',
      message: 'OTP generated in development mode (logged to server console)',
    };
  }
}

export const smsService = new SmsService();
