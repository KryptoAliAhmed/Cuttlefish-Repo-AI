 #!/usr/bin/env python3
"""
Test script to verify your credentials are working correctly after 1 year.
Run this to check if your system is ready for uploads.
"""

import os
import sys
from run import YouTubeUploader

def test_credentials():
    """Test if credentials are working."""
    print("🧪 Testing YouTube API credentials...")
    print("=" * 40)
    
    try:
        # Check if credential files exist
        client_json_exists = os.path.exists("client.json")
        service_account_exists = os.path.exists("service-account.json")
        credentials_exists = os.path.exists("credentials.json")
        
        print(f"Client.json file: {'✅' if client_json_exists else '❌'}")
        print(f"Service account file: {'✅' if service_account_exists else '❌'}")
        print(f"OAuth credentials file: {'✅' if credentials_exists else '❌'}")
        
        if not client_json_exists and not service_account_exists and not credentials_exists:
            print("\n❌ No credential files found!")
            print("💡 You need one of these files:")
            print("   - client.json (OAuth credentials)")
            print("   - service-account.json (service account)")
            print("   - credentials.json (OAuth credentials)")
            return False
        
        # Test authentication
        print("\n🔐 Testing authentication...")
        uploader = YouTubeUploader()
        uploader.initialize()
        
        print("✅ Authentication successful!")
        print("✅ YouTube API connection working!")
        print("✅ Your system is ready for uploads!")
        print("\n🎯 You can now run: python auto_upload.py")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        print("\n💡 Possible solutions:")
        print("   1. Check your credential files")
        print("   2. Make sure YouTube API is enabled")
        print("   3. Verify your service account permissions")
        return False

if __name__ == "__main__":
    success = test_credentials()
    if success:
        print("\n🎉 All tests passed! Your system is ready.")
    else:
        print("\n⚠️  Tests failed. Please check your setup.")
    sys.exit(0 if success else 1)