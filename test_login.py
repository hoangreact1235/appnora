import http.client
import json

conn = http.client.HTTPConnection("localhost", 3000)
headers = {"Content-type": "application/json"}
body = json.dumps({"username": "hoangleadermedia", "password": "Hoang1235@"})
conn.request("POST", "/api/auth/login", body, headers)
response = conn.getresponse()
print(response.status, response.reason)
print(response.read().decode())
conn.close()
