# Resume Marketing Tool

This project is a **Resume Distribution Tool** that allows users to upload a recruiter list and their resume, then send personalized emails (with attachments) to each recruiter using the Gmail API. The app is built with Flask (Python), uses Google OAuth2 for authentication, and supports both CSV and Excel recruiter lists. All file processing is done in-memory for efficiency and security.

---

## Features

- **Google OAuth2 Login**: Secure authentication using your Google account.
- **Gmail API Integration**: Send emails directly from your Gmail account (no SMTP passwords needed).
- **Personalized Bulk Email**: Automatically personalizes each email with the recruiter's first name.
- **In-memory File Processing**: No files are saved to disk; uploads are processed in RAM.
- **Modern UI**: Clean, responsive interface using Tailwind CSS.
- **Background Email Sending**: Emails are sent asynchronously so the UI remains responsive.

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/personalized-email-sender.git
cd personalized-email-sender
```

### 2. Create and activate a virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up Google OAuth2 credentials

- Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- Create an OAuth 2.0 Client ID (Web application)
- Add `http://localhost:5000/login/google/authorized` as an authorized redirect URI
- Download your credentials and set the following environment variables (you can use a `.env` file):

```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FLASK_SECRET_KEY=your-random-secret-key
```

### 5. Run the application

```bash
flask run
```

Visit [http://localhost:5000](http://localhost:5000) in your browser.

---

## Usage

1. **Login with Google**  
   Click "Sign in with Google" to authenticate.

2. **Upload Files**  
   Upload your recruiter list (CSV or Excel) and your resume (PDF or Word).

3. **Compose Email**  
   Write your email body. Use `[Recruiter Name]` as a placeholder for each recruiter's first name.

4. **Send Emails**  
   Click "Send Emails" to send personalized emails to all recruiters in your list.

---

## Notes

- All processing is done in-memory; no files are stored on disk.
- You must grant Gmail API access to your Google account.
- The app does **not** store your emails, recruiter data, or resume after processing.

---

## License

MIT License

---

**For questions or contributions, please open an issue or pull request.**
