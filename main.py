from flask import Flask, redirect, url_for, render_template, session, request, jsonify, g
from dotenv import load_dotenv
import os
from file_processor import FileProcessor
from email_service import EmailService
from authlib.integrations.flask_client import OAuth
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4  


# Load environment variables from .env file
load_dotenv()
executor = ThreadPoolExecutor(max_workers=3)


# Simple in-memory store
progress_tracker = {}

# Initialize the Flask app
app = Flask(__name__)

# Set secret key from environment variable or fallback to "dev"
app.secret_key = os.getenv("FLASK_SECRET_KEY") 

# Allow OAuthlib to run insecure transport for development
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

oauth = OAuth(app)

oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile https://www.googleapis.com/auth/gmail.send',
        'access_type': 'offline',
        'prompt': 'consent'
    }
)


# Route for the home page
@app.route("/")
def index():
    user = session.get('user')
    if not user:
        return redirect(url_for('login'))
    return render_template("index.html", user=user)

# Callback route after Google login
@app.route("/login/google/authorized")
def google_auth_callback():
    token = oauth.google.authorize_access_token()
    user = oauth.google.userinfo()
    session['user'] = user
    session['google_oauth_token'] = token
    return redirect(url_for("index"))

# Route to log out the user
@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))

# API route to handle sending emails
@app.route("/send-emails", methods=["POST"])
def send_emails():
    
    resume_file = request.files.get("resume")
    recruiters_file = request.files.get("recruiters")
    email_body = request.form.get("email_body")

    if not resume_file or not recruiters_file or not email_body:
        return jsonify({"status": "error", "message": "Missing fields"}), 400

    # Parse recruiter list directly from in-memory file
    recruiters_file.stream.seek(0)
    processor = FileProcessor(recruiters_file)
    recruiter_list = processor.parse_recruiters()

    # Generate a unique job ID
    job_id = str(uuid4())
    progress_tracker[job_id] = {
        "total": len(recruiter_list),
        "sent": 0,
        "failed": 0
    }

    # Get token info from session
    token = session.get("google_oauth_token")
    token_info = {
        'client_id': os.getenv("GOOGLE_CLIENT_ID"),
        'client_secret': os.getenv("GOOGLE_CLIENT_SECRET"),
        'access_token': token.get('access_token'),
        'refresh_token': token.get('refresh_token')
    }

    email_service = EmailService(token_info)
    sender_email = session.get('user', {}).get('email')
    subject = "Experienced Full-Stack Engineer Open to New Opportunities"

    # Read resume file in-memory
    resume_file.stream.seek(0)
    resume_data = resume_file.read()
    attachments = [{
        "filename": resume_file.filename,
        "data": resume_data,
        "mime_type": "application/pdf" if resume_file.filename.endswith(".pdf") else "application/msword"
    }]

    # Fire off background task
    # executor.submit(email_service.send_bulk_emails, sender_email, recruiter_list, subject, email_body, attachments)

    # return jsonify({"status": "success", "message": "Emails are being sent in the background."})
    # Fire off background task
    executor.submit(
        email_service.send_bulk_emails_with_progress,
        sender_email,
        recruiter_list,
        subject,
        email_body,
        attachments,
        job_id,
        progress_tracker
    )

    return jsonify({
        "status": "success",
        "message": "Emails are being sent in the background.",
        "job_id": job_id
    })

# API route to handle recruiters file upload
@app.route("/upload-recruiters", methods=["POST"])
def upload_recruiters():
    recruiters_file = request.files.get("recruiters")

    if not recruiters_file:
        return jsonify({"status": "error", "message": "No recruiter file provided"}), 400

    processor = FileProcessor(recruiters_file)
    try:
        recruiter_data = processor.parse_recruiters()
    except Exception as e:
        return jsonify({"status": "error", "message": f"Failed to parse file: {str(e)}"}), 400

    return jsonify({"status": "success", "recruiters": recruiter_data})

@app.route('/send-test-email', methods=['POST'])
def send_test_email():
    data = request.get_json()

    # Get token info from Flask-Dance's storage
    token_info = None
    token = session.get("google_oauth_token")
    if token:
        token_info = {
            'client_id': os.getenv("GOOGLE_CLIENT_ID"),
            'client_secret': os.getenv("GOOGLE_CLIENT_SECRET"),
            'access_token': token.get('access_token')
            # need to use refresh_token if available, having issue getting it from session 
            # probably because of the app is in testing mode and not yet verified
            # 'refresh_token': token.get('refresh_token')  # Optional, but recommended for
        }

    # if not token_info or not token_info['refresh_token']:
    if not token_info:
        return jsonify({'error': 'OAuth token info missing or incomplete.'}), 400

    email_service = EmailService(token_info)

    recipient = session.get('user', {}).get('email') or data.get('recipient')
    if not recipient:
        return jsonify({'error': 'Recipient email is required.'}), 400

    try:
        # Use the authenticated user's email as sender_email
        sender_email = session.get('user', {}).get('email')
        if not sender_email:
            return jsonify({'error': 'Sender email not found in session.'}), 400
        email_service.send_test_email(token_info=token_info, sender_email=sender_email, recipient_email=recipient)
        return jsonify({'message': f'Test email sent successfully to {recipient}.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['GET'])
def login():
    return render_template("login.html")

@app.route('/login/google')
def login_google():
    redirect_uri = url_for('google_auth_callback', _external=True)
    return oauth.google.authorize_redirect(redirect_uri)

@app.route("/progress/<job_id>")
def get_progress(job_id):
    progress = progress_tracker.get(job_id)
    if not progress:
        return jsonify({"status": "not_found"}), 404
    return jsonify(progress)


# Entry point to run the Flask app
if __name__ == "__main__":
    # Run without debug mode to avoid _multiprocessing errors in some environments
    app.run(debug=False)
