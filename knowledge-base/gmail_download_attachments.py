import os
import base64
import re
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# Configuration
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
CLIENT_SECRET_FILE = 'client_secret.json'
TOKEN_FILE = 'token.json'
DOWNLOAD_DIR = 'downloads'
FILE_REGEX = r'\.(pdf|docx?|xlsx?)$'  # Regex to match desired file types

def authenticate():
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if not creds or not creds.valid:
        flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_FILE, SCOPES)
        creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())
    return creds

def save_attachment(service, msg_id, part, download_path):
    filename = part.get("filename")
    if not filename or not re.search(FILE_REGEX, filename, re.IGNORECASE):
        return

    body = part.get("body", {})
    data = body.get("data")
    att_id = body.get("attachmentId")

    if att_id:
        attachment = service.users().messages().attachments().get(
            userId='me', messageId=msg_id, id=att_id).execute()
        data = attachment['data']

    file_data = base64.urlsafe_b64decode(data.encode("UTF-8"))
    file_path = os.path.join(download_path, filename)

    with open(file_path, 'wb') as f:
        f.write(file_data)
    print(f"✅ Saved: {filename}")

def download_attachments():
    creds = authenticate()
    service = build('gmail', 'v1', credentials=creds)

    os.makedirs(DOWNLOAD_DIR, exist_ok=True)

    # You can customize the query below to target specific emails
    response = service.users().messages().list(userId='me', q='has:attachment', maxResults=50).execute()
    messages = response.get('messages', [])

    print(f"📩 Found {len(messages)} emails with attachments.")

    for msg in messages:
        msg_id = msg['id']
        msg_data = service.users().messages().get(userId='me', id=msg_id).execute()
        payload = msg_data.get('payload', {})
        parts = payload.get('parts', [])

        for part in parts:
            if part.get("filename"):
                save_attachment(service, msg_id, part, DOWNLOAD_DIR)

if __name__ == '__main__':
    download_attachments()
