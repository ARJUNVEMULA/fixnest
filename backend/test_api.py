import subprocess
import requests

auth_resp = requests.post("http://127.0.0.1:8000/api/auth/token", data={"username": "admin@fixnest.com", "password": "password"})
token = auth_resp.json().get("access_token")
if token:
    bk_resp = requests.get("http://127.0.0.1:8000/api/bookings", headers={"Authorization": f"Bearer {token}"})
    print("STATUS", bk_resp.status_code)
    print("TEXT", bk_resp.text)
else:
    print("Failed to authenticate as admin. Trying to create one...")
