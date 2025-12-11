// Email templates for Resend integration
// These are used in Supabase Edge Functions

export const emailStyles = {
  wrapper: `
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: #f5f5f5;
  `,
  container: `
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  `,
  header: `
    background: linear-gradient(135deg, #1BA94C 0%, #2196F3 100%);
    padding: 30px 40px;
    text-align: center;
  `,
  headerTitle: `
    color: #ffffff;
    margin: 0;
    font-size: 28px;
    font-weight: bold;
  `,
  headerSubtitle: `
    color: rgba(255,255,255,0.9);
    margin: 8px 0 0;
    font-size: 14px;
  `,
  content: `
    padding: 40px;
  `,
  footer: `
    background-color: #f8fafc;
    padding: 30px 40px;
    text-align: center;
    border-top: 1px solid #e5e5e5;
  `,
  button: `
    display: inline-block;
    background-color: #1BA94C;
    color: #ffffff;
    text-decoration: none;
    padding: 14px 32px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
  `,
  buttonSecondary: `
    display: inline-block;
    background-color: #f8fafc;
    color: #333333;
    text-decoration: none;
    padding: 14px 32px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    border: 1px solid #e5e5e5;
  `,
};

export interface EmailTemplateData {
  recipientName?: string;
  [key: string]: any;
}

// Email Verification Template
export function emailVerificationTemplate(data: EmailTemplateData): string {
  const { recipientName = "there", verificationUrl } = data;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${emailStyles.wrapper}">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="${emailStyles.container}">
              <tr>
                <td style="${emailStyles.header}">
                  <h1 style="${emailStyles.headerTitle}">BLINNO</h1>
                  <p style="${emailStyles.headerSubtitle}">Verify Your Email Address</p>
                </td>
              </tr>
              <tr>
                <td style="${emailStyles.content}">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <div style="width: 80px; height: 80px; background-color: #e0f2fe; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                      <span style="font-size: 40px;">✉️</span>
                    </div>
                    <h2 style="color: #333333; margin: 0 0 10px;">Almost there!</h2>
                    <p style="color: #666666; margin: 0;">Just one more step to get started.</p>
                  </div>
                  
                  <p style="color: #333333; line-height: 1.6; margin-bottom: 20px;">
                    Hi ${recipientName},
                  </p>
                  
                  <p style="color: #666666; line-height: 1.6; margin-bottom: 20px;">
                    Thanks for signing up for Blinno! Please verify your email address to complete your registration and start exploring our marketplace.
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="${emailStyles.button}; padding: 16px 40px; font-size: 16px;">
                      Verify Email Address
                    </a>
                  </div>
                  
                  <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                    Or copy and paste this link into your browser:
                  </p>
                  <p style="color: #1BA94C; font-size: 12px; word-break: break-all; background-color: #f8f9fa; padding: 12px; border-radius: 6px;">
                    ${verificationUrl}
                  </p>
                  
                  <div style="background-color: #fef3c7; border: 1px solid #fcd34d; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="color: #92400e; margin: 0; font-size: 14px;">
                      ⏰ This verification link will expire in 24 hours.
                    </p>
                  </div>
                  
                  <p style="color: #999999; font-size: 12px; margin-top: 30px;">
                    If you didn't create an account on Blinno, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="${emailStyles.footer}">
                  <p style="color: #666666; margin: 0 0 10px; font-size: 12px;">Questions? Contact us at support@blinno.app</p>
                  <p style="color: #cccccc; margin: 0; font-size: 11px;">© ${new Date().getFullYear()} Blinno Marketplace. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Welcome Email Template
export function welcomeEmailTemplate(data: EmailTemplateData): string {
  const { recipientName = "there" } = data;
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${emailStyles.wrapper}">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="${emailStyles.container}">
              <tr>
                <td style="${emailStyles.header}">
                  <h1 style="${emailStyles.headerTitle}">BLINNO</h1>
                  <p style="${emailStyles.headerSubtitle}">Welcome to the Everything Marketplace</p>
                </td>
              </tr>
              <tr>
                <td style="${emailStyles.content}">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <span style="font-size: 48px;">🎉</span>
                    <h2 style="color: #333333; margin: 20px 0 10px;">Welcome to Blinno!</h2>
                  </div>
                  
                  <p style="color: #333333; line-height: 1.6; margin-bottom: 20px;">
                    Hi ${recipientName},
                  </p>
                  
                  <p style="color: #666666; line-height: 1.6; margin-bottom: 20px;">
                    We're thrilled to have you join our community! Blinno is your gateway to discovering amazing products, services, courses, and experiences from sellers across East Africa.
                  </p>
                  
                  <div style="background-color: #f0fdf4; border: 1px solid #86efac; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #166534; margin: 0 0 10px;">Here's what you can do:</h3>
                    <ul style="color: #166534; margin: 0; padding-left: 20px;">
                      <li style="margin-bottom: 8px;">Browse thousands of products and services</li>
                      <li style="margin-bottom: 8px;">Pay securely with M-Pesa, Visa, and more</li>
                      <li style="margin-bottom: 8px;">Track your orders in real-time</li>
                      <li>Start selling and grow your business</li>
                    </ul>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://www.blinno.app/products" style="${emailStyles.button}">
                      Start Exploring
                    </a>
                  </div>
                  
                  <p style="color: #666666; font-size: 14px; margin-top: 30px;">
                    Have questions? Reply to this email or visit our Help Center.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="${emailStyles.footer}">
                  <p style="color: #666666; margin: 0 0 10px; font-size: 12px;">Welcome to the Blinno community!</p>
                  <p style="color: #cccccc; margin: 0; font-size: 11px;">© ${new Date().getFullYear()} Blinno Marketplace. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Order Confirmation Email Template
export function orderConfirmationTemplate(data: EmailTemplateData): string {
  const { recipientName = "there", orderId, orderDate, items = [], totalAmount, shippingAddress } = data;
  
  const itemsHtml = items.map((item: any) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">${item.title}</td>
      <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">${item.quantity}</td>
      <td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6;">${item.price}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${emailStyles.wrapper}">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="${emailStyles.container}">
              <tr>
                <td style="${emailStyles.header}">
                  <h1 style="${emailStyles.headerTitle}">BLINNO</h1>
                  <p style="${emailStyles.headerSubtitle}">Order Confirmation</p>
                </td>
              </tr>
              <tr>
                <td style="${emailStyles.content}">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <span style="font-size: 48px;">✅</span>
                    <h2 style="color: #1BA94C; margin: 20px 0 10px;">Order Confirmed!</h2>
                  </div>
                  
                  <p style="color: #333333; line-height: 1.6;">Hi ${recipientName},</p>
                  <p style="color: #666666; line-height: 1.6;">Thank you for your order! We've received your purchase and are getting everything ready.</p>
                  
                  <div style="background-color: #f0fdf4; border: 1px solid #86efac; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0 0 8px; color: #166534;"><strong>Order Number:</strong> #${orderId}</p>
                    <p style="margin: 0; color: #166534;"><strong>Order Date:</strong> ${orderDate}</p>
                  </div>
                  
                  <h3 style="color: #333333; margin-top: 30px;">Order Summary</h3>
                  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="background-color: #f8f9fa;">
                      <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Product</th>
                      <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
                      <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
                    </tr>
                    ${itemsHtml}
                    <tr style="font-weight: bold; font-size: 18px;">
                      <td colspan="2" style="padding: 12px; text-align: right; color: #1BA94C;">Total:</td>
                      <td style="padding: 12px; text-align: right; color: #1BA94C;">${totalAmount}</td>
                    </tr>
                  </table>
                  
                  ${shippingAddress ? `
                  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="margin: 0 0 12px; color: #333333;">Shipping Address</h4>
                    <p style="margin: 0; color: #666666;">${shippingAddress}</p>
                  </div>
                  ` : ''}
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://www.blinno.app/buyer/orders" style="${emailStyles.button}">
                      Track Your Order
                    </a>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="${emailStyles.footer}">
                  <p style="color: #666666; margin: 0 0 10px; font-size: 12px;">Questions? Contact support@blinno.app</p>
                  <p style="color: #cccccc; margin: 0; font-size: 11px;">© ${new Date().getFullYear()} Blinno Marketplace</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Payment Receipt Email Template
export function paymentReceiptTemplate(data: EmailTemplateData): string {
  const { recipientName = "there", amount, currency = "TZS", network, reference, transactionDate, description } = data;
  
  const formattedAmount = new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${emailStyles.wrapper}">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="${emailStyles.container}">
              <tr>
                <td style="${emailStyles.header}">
                  <h1 style="${emailStyles.headerTitle}">BLINNO</h1>
                  <p style="${emailStyles.headerSubtitle}">Payment Receipt</p>
                </td>
              </tr>
              <tr>
                <td style="${emailStyles.content}">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <div style="width: 80px; height: 80px; background-color: #dcfce7; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                      <span style="font-size: 40px;">✓</span>
                    </div>
                    <h2 style="color: #1BA94C; margin: 20px 0 10px;">Payment Successful!</h2>
                    <p style="color: #666666;">Your payment has been processed successfully.</p>
                  </div>
                  
                  <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; text-align: center; margin: 20px 0;">
                    <p style="color: #666666; margin: 0 0 8px; font-size: 14px;">Amount Paid</p>
                    <p style="color: #1BA94C; margin: 0; font-size: 36px; font-weight: bold;">${formattedAmount}</p>
                  </div>
                  
                  <h3 style="color: #333333; margin: 30px 0 16px; font-size: 18px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Transaction Details</h3>
                  <table width="100%" cellpadding="8" cellspacing="0" style="font-size: 14px;">
                    <tr>
                      <td style="color: #666666; padding: 8px 0;">Reference</td>
                      <td style="color: #333333; font-weight: 500; text-align: right; font-family: monospace;">${reference}</td>
                    </tr>
                    <tr style="background-color: #f8fafc;">
                      <td style="color: #666666; padding: 8px;">Payment Network</td>
                      <td style="color: #333333; font-weight: 500; text-align: right; padding: 8px;">${network}</td>
                    </tr>
                    <tr>
                      <td style="color: #666666; padding: 8px 0;">Date & Time</td>
                      <td style="color: #333333; font-weight: 500; text-align: right;">${transactionDate}</td>
                    </tr>
                    ${description ? `
                    <tr style="background-color: #f8fafc;">
                      <td style="color: #666666; padding: 8px;">Description</td>
                      <td style="color: #333333; font-weight: 500; text-align: right; padding: 8px;">${description}</td>
                    </tr>
                    ` : ''}
                  </table>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://www.blinno.app/buyer/payments" style="${emailStyles.button}">
                      View Transaction History
                    </a>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="${emailStyles.footer}">
                  <p style="color: #666666; margin: 0 0 10px; font-size: 12px;">This is an automated receipt for your records.</p>
                  <p style="color: #999999; margin: 0 0 10px; font-size: 12px;">Questions? <a href="mailto:support@blinno.app" style="color: #1BA94C;">support@blinno.app</a></p>
                  <p style="color: #cccccc; margin: 0; font-size: 11px;">© ${new Date().getFullYear()} Blinno Marketplace</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Shipping Update Email Template
export function shippingUpdateTemplate(data: EmailTemplateData): string {
  const { recipientName = "there", orderId, status, trackingNumber, carrier, estimatedDelivery } = data;

  const statusMessages: Record<string, { icon: string; title: string; message: string }> = {
    shipped: {
      icon: "📦",
      title: "Your Order Has Shipped!",
      message: "Great news! Your order is on its way.",
    },
    out_for_delivery: {
      icon: "🚚",
      title: "Out for Delivery",
      message: "Your package is out for delivery and will arrive today!",
    },
    delivered: {
      icon: "✅",
      title: "Delivered!",
      message: "Your package has been delivered. Enjoy!",
    },
  };

  const statusInfo = statusMessages[status] || statusMessages.shipped;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${emailStyles.wrapper}">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="${emailStyles.container}">
              <tr>
                <td style="${emailStyles.header}">
                  <h1 style="${emailStyles.headerTitle}">BLINNO</h1>
                  <p style="${emailStyles.headerSubtitle}">Shipping Update</p>
                </td>
              </tr>
              <tr>
                <td style="${emailStyles.content}">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <span style="font-size: 48px;">${statusInfo.icon}</span>
                    <h2 style="color: #333333; margin: 20px 0 10px;">${statusInfo.title}</h2>
                    <p style="color: #666666;">${statusInfo.message}</p>
                  </div>
                  
                  <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0 0 8px; color: #0369a1;"><strong>Order Number:</strong> #${orderId}</p>
                    ${carrier ? `<p style="margin: 0 0 8px; color: #0369a1;"><strong>Carrier:</strong> ${carrier}</p>` : ''}
                    ${trackingNumber ? `<p style="margin: 0 0 8px; color: #0369a1;"><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
                    ${estimatedDelivery ? `<p style="margin: 0; color: #0369a1;"><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>` : ''}
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://www.blinno.app/order/${orderId}" style="${emailStyles.button}">
                      Track Your Package
                    </a>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="${emailStyles.footer}">
                  <p style="color: #666666; margin: 0 0 10px; font-size: 12px;">Questions about your delivery? Contact support@blinno.app</p>
                  <p style="color: #cccccc; margin: 0; font-size: 11px;">© ${new Date().getFullYear()} Blinno Marketplace</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Password Reset Email Template
export function passwordResetTemplate(data: EmailTemplateData): string {
  const { recipientName = "there", resetLink } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${emailStyles.wrapper}">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="${emailStyles.container}">
              <tr>
                <td style="${emailStyles.header}">
                  <h1 style="${emailStyles.headerTitle}">BLINNO</h1>
                  <p style="${emailStyles.headerSubtitle}">Password Reset</p>
                </td>
              </tr>
              <tr>
                <td style="${emailStyles.content}">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <span style="font-size: 48px;">🔐</span>
                    <h2 style="color: #333333; margin: 20px 0 10px;">Reset Your Password</h2>
                  </div>
                  
                  <p style="color: #333333; line-height: 1.6;">Hi ${recipientName},</p>
                  <p style="color: #666666; line-height: 1.6;">
                    We received a request to reset the password for your Blinno account. Click the button below to create a new password.
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="${emailStyles.button}">
                      Reset Password
                    </a>
                  </div>
                  
                  <div style="background-color: #fef3c7; border: 1px solid #fcd34d; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                      ⚠️ This link expires in 1 hour. If you didn't request this reset, you can safely ignore this email.
                    </p>
                  </div>
                  
                  <p style="color: #999999; font-size: 12px; margin-top: 30px;">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    <a href="${resetLink}" style="color: #1BA94C; word-break: break-all;">${resetLink}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="${emailStyles.footer}">
                  <p style="color: #666666; margin: 0 0 10px; font-size: 12px;">Need help? Contact support@blinno.app</p>
                  <p style="color: #cccccc; margin: 0; font-size: 11px;">© ${new Date().getFullYear()} Blinno Marketplace</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Newsletter Email Template
export function newsletterTemplate(data: EmailTemplateData): string {
  const { recipientName = "there", subject, content, unsubscribeLink } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${emailStyles.wrapper}">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="${emailStyles.container}">
              <tr>
                <td style="${emailStyles.header}">
                  <h1 style="${emailStyles.headerTitle}">BLINNO</h1>
                  <p style="${emailStyles.headerSubtitle}">Newsletter</p>
                </td>
              </tr>
              <tr>
                <td style="${emailStyles.content}">
                  <h2 style="color: #333333; margin: 0 0 20px;">${subject}</h2>
                  <p style="color: #333333; line-height: 1.6;">Hi ${recipientName},</p>
                  
                  <div style="color: #666666; line-height: 1.8; margin: 20px 0;">
                    ${content}
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://www.blinno.app/products" style="${emailStyles.button}">
                      Shop Now
                    </a>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="${emailStyles.footer}">
                  <p style="color: #666666; margin: 0 0 10px; font-size: 12px;">
                    You're receiving this because you subscribed to the Blinno newsletter.
                  </p>
                  <p style="color: #999999; margin: 0 0 10px; font-size: 12px;">
                    <a href="${unsubscribeLink}" style="color: #999999;">Unsubscribe</a>
                  </p>
                  <p style="color: #cccccc; margin: 0; font-size: 11px;">© ${new Date().getFullYear()} Blinno Marketplace</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Security Alert Email Template
export function securityAlertTemplate(data: EmailTemplateData): string {
  const { recipientName = "there", alertType, description, actionRequired, timestamp, ipAddress, location } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="${emailStyles.wrapper}">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="${emailStyles.container}">
              <tr>
                <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px 40px; text-align: center;">
                  <h1 style="${emailStyles.headerTitle}">BLINNO</h1>
                  <p style="${emailStyles.headerSubtitle}">Security Alert</p>
                </td>
              </tr>
              <tr>
                <td style="${emailStyles.content}">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <span style="font-size: 48px;">🔔</span>
                    <h2 style="color: #dc2626; margin: 20px 0 10px;">${alertType}</h2>
                  </div>
                  
                  <p style="color: #333333; line-height: 1.6;">Hi ${recipientName},</p>
                  <p style="color: #666666; line-height: 1.6;">${description}</p>
                  
                  <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="color: #dc2626; margin: 0 0 12px;">Details</h4>
                    <table width="100%" style="font-size: 14px;">
                      <tr>
                        <td style="color: #666666; padding: 4px 0;">Time:</td>
                        <td style="color: #333333; font-weight: 500;">${timestamp}</td>
                      </tr>
                      ${ipAddress ? `
                      <tr>
                        <td style="color: #666666; padding: 4px 0;">IP Address:</td>
                        <td style="color: #333333; font-weight: 500;">${ipAddress}</td>
                      </tr>
                      ` : ''}
                      ${location ? `
                      <tr>
                        <td style="color: #666666; padding: 4px 0;">Location:</td>
                        <td style="color: #333333; font-weight: 500;">${location}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </div>
                  
                  ${actionRequired ? `
                  <div style="background-color: #fff7ed; border: 1px solid #fed7aa; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; color: #c2410c; font-size: 14px;">
                      <strong>Action Required:</strong> ${actionRequired}
                    </p>
                  </div>
                  ` : ''}
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://www.blinno.app/buyer/settings" style="${emailStyles.button}">
                      Review Account Security
                    </a>
                  </div>
                  
                  <p style="color: #999999; font-size: 12px; margin-top: 30px;">
                    If this was you, you can ignore this email. If you didn't perform this action, please secure your account immediately.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="${emailStyles.footer}">
                  <p style="color: #666666; margin: 0 0 10px; font-size: 12px;">Questions? Contact support@blinno.app</p>
                  <p style="color: #cccccc; margin: 0; font-size: 11px;">© ${new Date().getFullYear()} Blinno Marketplace</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
