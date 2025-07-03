import base64
import csv
from email.message import EmailMessage
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from jinja2 import Template
from datetime import datetime, timezone

class EmailService:
    def __init__(self, token_info):
        self.client_id = token_info.get('client_id')
        self.client_secret = token_info.get('client_secret')
        self.access_token = token_info.get('access_token')
        self.creds = Credentials(
            token=self.access_token,
            client_id=self.client_id,
            client_secret=self.client_secret,
            scopes=["https://www.googleapis.com/auth/gmail.send"]
        )

    def send_email(self, sender_email, recipient_email, subject, body, attachments=None):
        message = EmailMessage()
        message.set_content(body)
        message['To'] = recipient_email
        message['From'] = sender_email
        message['Subject'] = subject

        if attachments:
            for attachment in attachments:
                file_data = attachment['data']
                file_name = attachment['filename']
                file_type = attachment.get('mime_type', 'application/octet-stream')
                maintype, subtype = file_type.split('/', 1)
                message.add_attachment(file_data, maintype=maintype, subtype=subtype, filename=file_name)

        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        service = build('gmail', 'v1', credentials=self.creds)
        send_message = {'raw': encoded_message}
        service.users().messages().send(userId="me", body=send_message).execute()

    def log_email_status(self, log_writer, recipient_email, status, error=""):
        log_writer.writerow([datetime.now(timezone.utc), recipient_email, status, error])

    def send_bulk_emails_with_progress(self, sender_email, recruiter_list, subject, body_template, attachments, job_id, progress_tracker, log_file_path="logs/email_log.csv"):
        with open(log_file_path, "w", newline='') as log_file:
            log_writer = csv.writer(log_file)
            log_writer.writerow(["Timestamp", "Recipient", "Status", "Error"])

            for recruiter in recruiter_list:
                recipient_email = recruiter.get("email")
                try:
                    body = Template(body_template).render(**recruiter)
                    self.send_email(sender_email, recipient_email, subject, body, attachments)
                    progress_tracker[job_id]["sent"] += 1
                    self.log_email_status(log_writer, recipient_email, "Sent")
                except Exception as e:
                    self.log_email_status(log_writer, recipient_email, "Failed", str(e))
                    print(f"Failed to send to {recipient_email}: {e}")
                    progress_tracker[job_id]["failed"] += 1

    @staticmethod
    def send_test_email(token_info, sender_email, recipient_email, log_file_path="logs/email_log.csv"):
        email_service = EmailService(token_info)
        subject = "Test Email from Resume Marketing Tool"
        body = (
            "Hello,\n\n"
            "This is a test email sent from the Resume Marketing Tool to confirm email sending functionality.\n\n"
            "Best regards,\nYour App"
        )
        # Logging for test email
        with open(log_file_path, "a", newline='') as log_file:
            log_writer = csv.writer(log_file)
            try:
                email_service.send_email(sender_email, recipient_email, subject, body)
                email_service.log_email_status(log_writer, recipient_email, "Sent")
            except Exception as e:
                email_service.log_email_status(log_writer, recipient_email, "Failed", str(e))
                print(f"Failed to send test email to {recipient_email}: {e}")

