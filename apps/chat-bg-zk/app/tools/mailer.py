import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from typing import Optional

# Load environment variables
load_dotenv()

class Mailer:
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER')
        self.smtp_port = int(os.getenv('SMTP_PORT', '465'))  # Default to SSL port
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.sender_email = os.getenv('SENDER_EMAIL')
        
        if not all([self.smtp_server, self.smtp_username, self.smtp_password, self.sender_email]):
            raise ValueError("Missing required email configuration in environment variables")

    def send_email(
        self,
        recipient_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None
    ) -> bool:
        """
        Send an email using SSL
        
        Args:
            recipient_email: Email address of the recipient
            subject: Email subject
            body: Plain text email body
            html_body: Optional HTML email body
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.sender_email
            msg['To'] = recipient_email

            # Attach plain text version
            msg.attach(MIMEText(body, 'plain'))

            # Attach HTML version if provided
            if html_body:
                msg.attach(MIMEText(html_body, 'html'))

            # Connect to SMTP server and send email using SSL
            with smtplib.SMTP_SSL(self.smtp_server, self.smtp_port) as server:
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            return True
            
        except Exception as e:
            print(f"Error sending email: {str(e)}")
            return False 