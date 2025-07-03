import base64
from email.message import EmailMessage
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

class EmailService:
    def __init__(self, token_info):
        """
        Initialize EmailService with a token_info dict from Google OAuth flow.

        Required fields in token_info: client_id, client_secret, access_token.
        Optional (but recommended if token refresh is needed): refresh_token.
        """
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
        # Create the email
        message = EmailMessage()
        message.set_content(body)
        message['To'] = recipient_email
        message['From'] = sender_email
        message['Subject'] = subject

        # Attach files if any
        if attachments:
            for attachment in attachments:
                file_data = attachment['data']
                file_name = attachment['filename']
                file_type = attachment.get('mime_type', 'application/octet-stream')
                maintype, subtype = file_type.split('/', 1)
                message.add_attachment(file_data, maintype=maintype, subtype=subtype, filename=file_name)

        # Encode message
        encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()

        # Build Gmail API service
        service = build('gmail', 'v1', credentials=self.creds)
        send_message = {
            'raw': encoded_message
        }
        # Send the email
        service.users().messages().send(userId="me", body=send_message).execute()

    def send_bulk_emails(self, sender_email, recruiter_list, subject, body, attachments=None):
        for recruiter in recruiter_list:
            try:
                recipient_email = recruiter.get("email")
                first_name = recruiter.get("first_name", "")
                # Replace placeholder with actual first name
                personalized_body = body.replace("[Recruiter Name]", first_name)
                self.send_email(sender_email, recipient_email, subject, personalized_body, attachments)
            except Exception as e:
                print(f"Failed to send email to {recipient_email}: {e}")


    @staticmethod
    def send_test_email(token_info, sender_email, recipient_email):
        """
        Utility function to send a test email using EmailService.
        """
        email_service = EmailService(token_info)
        subject = "Test Email from Resume Marketing Tool"
        body = (
            "Hello,\n\n"
            "This is a test email sent from the Resume Marketing Tool to confirm email sending functionality.\n\n"
            "Best regards,\nYour App"
        )
        email_service.send_email(sender_email, recipient_email, subject, body)

