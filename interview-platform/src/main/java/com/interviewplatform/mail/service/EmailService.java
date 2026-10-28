package com.interviewplatform.mail.service;

import jakarta.annotation.PostConstruct;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username:interviewhub21@gmail.com}")
    private String smtpUsername;

    @Value("${spring.mail.password:}")
    private String smtpPassword;

    @Value("${mail.api-key:}")
    private String apiKey;

    @Value("${mail.from-email:interviewhub21@gmail.com}")
    private String fromEmail;

    @Value("${mail.from-name:InterviewHub}")
    private String fromName;

    @Value("${app.client-url:${CORS_CLIENT_URL:http://localhost:5173}}")
    private String clientUrl;

    private volatile HttpClient httpClient;

    private HttpClient getClient() {
        if (this.httpClient == null) {
            synchronized (this) {
                if (this.httpClient == null) {
                    try { this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(6)).build(); } catch (Throwable t) { this.httpClient = null; }
                }
            }
        }
        return this.httpClient;
    }

    public EmailService(@Autowired(required = false) JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
        try { this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(6)).build(); } catch (Throwable t) { this.httpClient = null; }
    }

    @PostConstruct
    public void init() {
        if (javaMailSender instanceof JavaMailSenderImpl mailSenderImpl) {
            if (smtpPassword != null && !smtpPassword.isBlank()) {
                // Ensure App Passwords with display spaces are cleanly stripped of whitespace
                mailSenderImpl.setPassword(smtpPassword.replaceAll("\\s+", "").trim());
            }
            if (smtpUsername != null && !smtpUsername.isBlank()) {
                mailSenderImpl.setUsername(smtpUsername.trim());
            }
        }
    }

    /**
     * Dispatches a Google-style password reset email with a 6-digit verification code.
     */
    @Async
    public void sendPasswordResetEmail(String toEmail, String recipientName, String resetCode) {
        String name = (recipientName != null && !recipientName.isBlank()) ? recipientName.trim() : "Candidate";
        String subject = "InterviewHub - G-" + resetCode + " is your verification code";
        String htmlContent = buildPasswordResetHtml(name, resetCode, toEmail != null ? toEmail.trim() : "");

        dispatchEmail(toEmail, name, subject, htmlContent, "PASSWORD_RESET", "G-" + resetCode);
    }

    /**
     * Dispatches a Google-style welcome email upon user registration or first login.
     */
    @Async
    public void sendWelcomeEmail(String toEmail, String recipientName) {
        String name = (recipientName != null && !recipientName.isBlank()) ? recipientName.trim() : "Candidate";
        String subject = "Welcome to InterviewHub";
        String htmlContent = buildWelcomeHtml(name, toEmail != null ? toEmail.trim() : "");

        dispatchEmail(toEmail, name, subject, htmlContent, "WELCOME", null);
    }

    /**
     * Dispatches a Google-style security alert email whenever a user signs into their account.
     */
    @Async
    public void sendLoginNotificationEmail(String toEmail, String recipientName, LocalDateTime loginTime) {
        String name = (recipientName != null && !recipientName.isBlank()) ? recipientName.trim() : "User";
        String timeStr = (loginTime != null)
                ? loginTime.format(DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm:ss"))
                : LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm:ss"));
        String subject = "Security alert: New sign-in to InterviewHub";
        String htmlContent = buildLoginAlertHtml(name, timeStr, toEmail != null ? toEmail.trim() : "");

        dispatchEmail(toEmail, name, subject, htmlContent, "LOGIN_NOTIFICATION", null);
    }

    private void dispatchEmail(String toEmail, String recipientName, String subject, String htmlContent, String emailType, String metaCode) {
        boolean sent = false;

        // 1. Primary: Try sending via Gmail SMTP (JavaMailSender)
        if (javaMailSender != null && smtpUsername != null && !smtpUsername.isBlank() && smtpPassword != null && !smtpPassword.isBlank()) {
            try {
                sendViaSmtp(toEmail, recipientName, subject, htmlContent);
                log.info("[EmailService] Real email successfully sent via Gmail SMTP to <{}>", toEmail);
                sent = true;
            } catch (Exception ex) {
                log.error("[EmailService] Gmail SMTP dispatch failed for <{}>: {}", toEmail, ex.getMessage());
            }
        }

        // 2. Secondary: Fallback to REST Mail API (Resend, Brevo, SendGrid) if configured
        if (!sent && apiKey != null && !apiKey.isBlank() && !apiKey.startsWith("${")) {
            try {
                if (apiKey.startsWith("SG.")) {
                    sendViaSendGrid(toEmail, subject, htmlContent);
                    log.info("[EmailService] Real email successfully dispatched via SendGrid to <{}>", toEmail);
                } else if (apiKey.startsWith("xkeysib-")) {
                    sendViaBrevo(toEmail, recipientName, subject, htmlContent);
                    log.info("[EmailService] Real email successfully dispatched via Brevo to <{}>", toEmail);
                } else {
                    sendViaResend(toEmail, subject, htmlContent);
                    log.info("[EmailService] Real email successfully dispatched via Resend to <{}>", toEmail);
                }
                sent = true;
            } catch (Exception ex) {
                log.error("[EmailService] External Mail API dispatch failed for <{}>: {}", toEmail, ex.getMessage());
            }
        }

        // 3. Diagnostic / Fallback Notice
        if (!sent) {
            log.warn("""
                \n================================================================================
                [INTERVIEW HUB EMAIL NOTIFICATION - DISPATCH NOTICE]
                Status:    NOT DELIVERED (Missing Gmail App Password or API Key)
                Type:      {}
                Recipient: {} <{}>
                Subject:   {}
                Code/OTP:  {}
                --------------------------------------------------------------------------------
                TO ACTIVATE GMAIL SMTP DELIVERY:
                1. Go to https://myaccount.google.com/apppasswords
                2. Generate a 16-character App Password for "InterviewHub"
                3. Set: SPRING_MAIL_PASSWORD=your_16_char_password in interview-platform/.env
                   (or pass via environment variable)
                ================================================================================""",
                emailType, recipientName, toEmail, subject, metaCode != null ? metaCode : "N/A");
        }
    }

    private void sendViaSmtp(String toEmail, String recipientName, String subject, String htmlContent) throws Exception {
        MimeMessage message = javaMailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        String senderEmail = (smtpUsername != null && !smtpUsername.isBlank()) ? smtpUsername.trim() : "interviewhub21@gmail.com";
        helper.setFrom(new InternetAddress(senderEmail, fromName != null ? fromName : "InterviewHub"));
        helper.setTo(toEmail.trim());
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        javaMailSender.send(message);
    }

    private void sendViaResend(String toEmail, String subject, String htmlContent) throws Exception {
        String effectiveFrom = (fromEmail != null && !fromEmail.isBlank() && !fromEmail.contains("@interviewhub.") && !fromEmail.contains("@gmail.com"))
                ? fromEmail.trim()
                : "onboarding@resend.dev";
        String sender = fromName + " <" + effectiveFrom + ">";
        String escapedHtml = escapeJson(htmlContent);
        String escapedSubject = escapeJson(subject);

        String jsonPayload = String.format(
                "{\"from\":\"%s\",\"to\":[\"%s\"],\"subject\":\"%s\",\"html\":\"%s\"}",
                sender, toEmail.trim(), escapedSubject, escapedHtml
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.resend.com/emails"))
                .header("Authorization", "Bearer " + apiKey.trim())
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(8))
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response = getClient().send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("Resend API error HTTP " + response.statusCode() + ": " + response.body());
        }
    }

    private void sendViaBrevo(String toEmail, String recipientName, String subject, String htmlContent) throws Exception {
        String escapedHtml = escapeJson(htmlContent);
        String escapedSubject = escapeJson(subject);
        String senderEmail = (smtpUsername != null && !smtpUsername.isBlank()) ? smtpUsername.trim() : "interviewhub21@gmail.com";

        String jsonPayload = String.format(
                "{\"sender\":{\"name\":\"%s\",\"email\":\"%s\"},\"to\":[{\"email\":\"%s\",\"name\":\"%s\"}],\"subject\":\"%s\",\"htmlContent\":\"%s\"}",
                fromName, senderEmail, toEmail.trim(), recipientName, escapedSubject, escapedHtml
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                .header("api-key", apiKey.trim())
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(8))
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response = getClient().send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("Brevo API error HTTP " + response.statusCode() + ": " + response.body());
        }
    }

    private void sendViaSendGrid(String toEmail, String subject, String htmlContent) throws Exception {
        String escapedHtml = escapeJson(htmlContent);
        String escapedSubject = escapeJson(subject);
        String senderEmail = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail.trim() : "interviewhub21@gmail.com";

        String jsonPayload = String.format(
                "{\"personalizations\":[{\"to\":[{\"email\":\"%s\"}]}],\"from\":{\"email\":\"%s\",\"name\":\"%s\"},\"subject\":\"%s\",\"content\":[{\"type\":\"text/html\",\"value\":\"%s\"}]}",
                toEmail.trim(), senderEmail, fromName, escapedSubject, escapedHtml
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.sendgrid.com/v3/mail/send"))
                .header("Authorization", "Bearer " + apiKey.trim())
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(8))
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response = getClient().send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("SendGrid API error HTTP " + response.statusCode() + ": " + response.body());
        }
    }

    private String escapeJson(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\b", "\\b")
                   .replace("\f", "\\f")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }

    /**
     * Builds a clean Google-style Verification Code / Password Reset Email Template.
     */
    private String buildPasswordResetHtml(String name, String resetCode, String toEmail) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>InterviewHub - Verification code</title>
              <style>
                body { margin: 0; padding: 24px; background-color: #f8f9fa; font-family: 'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #202124; -webkit-font-smoothing: antialiased; }
                .wrapper { max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #dadce0; border-radius: 8px; padding: 36px 40px; box-sizing: border-box; }
                .brand { font-size: 22px; font-weight: 500; color: #202124; letter-spacing: -0.4px; }
                .brand-accent { color: #1a73e8; font-weight: 600; }
                .divider { height: 1px; background-color: #dadce0; margin: 18px 0 24px; border: none; }
                .heading { font-size: 22px; font-weight: 500; color: #202124; margin: 0 0 16px; line-height: 1.3; }
                .body-text { font-size: 14px; line-height: 1.6; color: #3c4043; margin: 0 0 20px; }
                .code-box { background-color: #f1f3f4; border-radius: 8px; padding: 20px 24px; text-align: center; margin: 24px 0; }
                .code-digits { font-family: 'Roboto Mono', Menlo, Monaco, Consolas, monospace; font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #202124; margin: 0; }
                .info-text { font-size: 13px; line-height: 1.5; color: #5f6368; margin: 0 0 12px; }
                .security-note { font-size: 12px; line-height: 1.5; color: #70757a; margin: 18px 0 0; }
                .footer { border-top: 1px solid #dadce0; margin-top: 32px; padding-top: 20px; font-size: 12px; color: #5f6368; line-height: 1.5; }
              </style>
            </head>
            <body>
              <div class="wrapper">
                <div class="brand">Interview<span class="brand-accent">Hub</span></div>
                <div class="divider"></div>
                <div class="heading">Verify your identity</div>
                <div class="body-text">
                  Hi {{name}},<br><br>
                  We received a request to reset your password. Use the single-use verification code below to set up your new credentials:
                </div>
                <div class="code-box">
                  <div class="code-digits">G-{{code}}</div>
                </div>
                <div class="info-text">
                  This code will expire in <strong>10 minutes</strong>.
                </div>
                <div class="info-text">
                  If you did not make this request, you can safely ignore this email &mdash; your account password remains completely secure.
                </div>
                <div class="security-note">
                  To protect your account, never share this code with anyone.
                </div>
                <div class="footer">
                  This email was sent to <strong>{{toEmail}}</strong> because a password reset was requested for your InterviewHub account.<br>
                  &copy; 2026 InterviewHub &bull; Engineering Interview Platform
                </div>
              </div>
            </body>
            </html>
            """.replace("{{name}}", name)
               .replace("{{code}}", resetCode)
               .replace("{{toEmail}}", toEmail);
    }

    /**
     * Builds a clean Google-style Welcome Email Template.
     */
    private String buildWelcomeHtml(String name, String toEmail) {
        String baseUrl = (clientUrl != null && !clientUrl.isBlank()) ? clientUrl.trim().replaceAll("/+$", "") : "http://localhost:5173";
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome to InterviewHub</title>
              <style>
                body { margin: 0; padding: 24px; background-color: #f8f9fa; font-family: 'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #202124; -webkit-font-smoothing: antialiased; }
                .wrapper { max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #dadce0; border-radius: 8px; padding: 36px 40px; box-sizing: border-box; }
                .brand { font-size: 22px; font-weight: 500; color: #202124; letter-spacing: -0.4px; }
                .brand-accent { color: #1a73e8; font-weight: 600; }
                .divider { height: 1px; background-color: #dadce0; margin: 18px 0 24px; border: none; }
                .heading { font-size: 22px; font-weight: 500; color: #202124; margin: 0 0 16px; line-height: 1.3; }
                .body-text { font-size: 14px; line-height: 1.6; color: #3c4043; margin: 0 0 20px; }
                .feature-box { background-color: #f8f9fa; border: 1px solid #e8eaed; border-radius: 8px; padding: 18px 20px; margin: 22px 0; }
                .feature-item { font-size: 13px; line-height: 1.5; color: #3c4043; margin-bottom: 12px; }
                .feature-item:last-child { margin-bottom: 0; }
                .feature-title { font-weight: 600; color: #202124; }
                .cta-row { margin: 26px 0 20px; }
                .btn-primary { display: inline-block; background-color: #1a73e8; color: #ffffff !important; font-size: 14px; font-weight: 500; text-decoration: none; padding: 10px 24px; border-radius: 4px; }
                .footer { border-top: 1px solid #dadce0; margin-top: 32px; padding-top: 20px; font-size: 12px; color: #5f6368; line-height: 1.5; }
              </style>
            </head>
            <body>
              <div class="wrapper">
                <div class="brand">Interview<span class="brand-accent">Hub</span></div>
                <div class="divider"></div>
                <div class="heading">Welcome to InterviewHub, {{name}}</div>
                <div class="body-text">
                  Your InterviewHub account is now active. Explore verified interview experiences shared by software engineers, practice real technical questions, and connect directly with peers:
                </div>
                <div class="feature-box">
                  <div class="feature-item">
                    <span class="feature-title">&bull; Verified Experiences:</span> In-depth breakdowns of real coding, system design, and managerial rounds.
                  </div>
                  <div class="feature-item">
                    <span class="feature-title">&bull; Interactive Code Playground:</span> Multi-language test runner directly in your browser.
                  </div>
                  <div class="feature-item">
                    <span class="feature-title">&bull; Live Peer Discussions:</span> Connect directly with verified authors and fellow candidates.
                  </div>
                </div>
                <div class="cta-row">
                  <a href="{{clientUrl}}/login?redirect=/experiences" class="btn-primary">Explore Experiences</a>
                </div>
                <div class="footer">
                  This email was sent to <strong>{{toEmail}}</strong> because you registered for InterviewHub.<br>
                  &copy; 2026 InterviewHub &bull; Engineering Interview Platform
                </div>
              </div>
            </body>
            </html>
            """.replace("{{name}}", name)
               .replace("{{toEmail}}", toEmail)
               .replace("{{clientUrl}}", baseUrl);
    }

    /**
     * Builds a clean Google-style Security Alert / Login Notification Email Template.
     */
    private String buildLoginAlertHtml(String name, String timeStr, String toEmail) {
        String baseUrl = (clientUrl != null && !clientUrl.isBlank()) ? clientUrl.trim().replaceAll("/+$", "") : "http://localhost:5173";
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Security alert - New sign-in</title>
              <style>
                body { margin: 0; padding: 24px; background-color: #f8f9fa; font-family: 'Google Sans', Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #202124; -webkit-font-smoothing: antialiased; }
                .wrapper { max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #dadce0; border-radius: 8px; padding: 36px 40px; box-sizing: border-box; }
                .brand { font-size: 22px; font-weight: 500; color: #202124; letter-spacing: -0.4px; }
                .brand-accent { color: #1a73e8; font-weight: 600; }
                .divider { height: 1px; background-color: #dadce0; margin: 18px 0 24px; border: none; }
                .heading { font-size: 22px; font-weight: 500; color: #202124; margin: 0 0 16px; line-height: 1.3; }
                .body-text { font-size: 14px; line-height: 1.6; color: #3c4043; margin: 0 0 20px; }
                .details-box { background-color: #f1f3f4; border-radius: 8px; padding: 18px 20px; margin: 20px 0; }
                .detail-line { font-size: 13px; color: #202124; margin-bottom: 6px; }
                .detail-line:last-child { margin-bottom: 0; }
                .info-text { font-size: 13px; line-height: 1.5; color: #5f6368; margin: 0 0 16px; }
                .cta-row { margin: 24px 0 20px; }
                .btn-primary { display: inline-block; background-color: #1a73e8; color: #ffffff !important; font-size: 14px; font-weight: 500; text-decoration: none; padding: 10px 24px; border-radius: 4px; }
                .footer { border-top: 1px solid #dadce0; margin-top: 32px; padding-top: 20px; font-size: 12px; color: #5f6368; line-height: 1.5; }
              </style>
            </head>
            <body>
              <div class="wrapper">
                <div class="brand">Interview<span class="brand-accent">Hub</span></div>
                <div class="divider"></div>
                <div class="heading">Security alert: New sign-in</div>
                <div class="body-text">
                  Hi {{name}},<br><br>
                  Your InterviewHub account was recently accessed:
                </div>
                <div class="details-box">
                  <div class="detail-line"><strong>Account:</strong> {{toEmail}}</div>
                  <div class="detail-line"><strong>Time:</strong> {{time}}</div>
                  <div class="detail-line"><strong>Application:</strong> InterviewHub Web Platform</div>
                </div>
                <div class="info-text">
                  If this was you, you can safely disregard this message. If you did not sign in at this time, please reset your password immediately to secure your account.
                </div>
                <div class="cta-row">
                  <a href="{{clientUrl}}/login" class="btn-primary">Check Activity</a>
                </div>
                <div class="footer">
                  This email was sent to <strong>{{toEmail}}</strong> to notify you of recent security activity.<br>
                  &copy; 2026 InterviewHub &bull; Engineering Interview Platform
                </div>
              </div>
            </body>
            </html>
            """.replace("{{name}}", name)
               .replace("{{time}}", timeStr)
               .replace("{{toEmail}}", toEmail)
               .replace("{{clientUrl}}", baseUrl);
    }
}
