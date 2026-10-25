from email.message import EmailMessage
import smtplib
import ssl


class SmtpMailer:
    def __init__(self, settings):
        self.settings = settings
        if settings.smtp_security not in {"starttls", "ssl"}:
            raise ValueError("SMTP_SECURITY must be starttls or ssl")

    @property
    def configured(self):
        return bool(self.settings.smtp_host and self.settings.smtp_from)

    def send_reset(self, email, url):
        s = self.settings
        message = EmailMessage()
        message["Subject"] = "Сброс пароля Verstak"
        message["From"] = s.smtp_from
        message["To"] = email
        message.set_content(f"Для смены пароля открой ссылку (действует 30 минут):\n\n{url}\n\nЕсли ты не запрашивал сброс, просто проигнорируй письмо.")
        context = ssl.create_default_context()
        connection = smtplib.SMTP_SSL(s.smtp_host, s.smtp_port, timeout=10, context=context) if s.smtp_security == "ssl" else smtplib.SMTP(s.smtp_host, s.smtp_port, timeout=10)
        with connection as smtp:
            if s.smtp_security == "starttls": smtp.starttls(context=context)
            if s.smtp_username: smtp.login(s.smtp_username, s.smtp_password)
            smtp.send_message(message)
