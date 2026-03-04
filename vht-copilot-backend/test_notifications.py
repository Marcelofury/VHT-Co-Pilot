"""
Test notifications and VHT referrals endpoints
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

# Login as VHT user
print("1. Logging in as VHT user...")
login_response = requests.post(f"{BASE_URL}/auth/token/", json={
    "username": "buteramarcel",
    "password": "password123"
})
vht_token = login_response.json()["access"]
print(f"✓ VHT Token obtained")

# Get VHT's referrals
print("\n2. Getting VHT's referrals...")
headers = {"Authorization": f"Bearer {vht_token}"}
referrals_response = requests.get(f"{BASE_URL}/referrals/my_referrals/?active_only=true", headers=headers)
print(f"✓ VHT has {len(referrals_response.json())} referrals")
for ref in referrals_response.json()[:3]:
    print(f"  - {ref['referral_code']}: {ref['status']} ({ref['urgency_level']})")

# Get notifications
print("\n3. Getting notifications...")
notifications_response = requests.get(f"{BASE_URL}/notifications/", headers=headers)
print(f"✓ VHT has {len(notifications_response.json())} notifications")
for notif in notifications_response.json()[:3]:
    status = "UNREAD" if not notif['is_read'] else "READ"
    print(f"  - {status}: {notif['title']}")

# Get unread count
print("\n4. Getting unread count...")
unread_response = requests.get(f"{BASE_URL}/notifications/unread_count/", headers=headers)
print(f"✓ Unread notifications: {unread_response.json()['count']}")

print("\n✅ All endpoints working!")
