import urllib.request
import json
import time

url = "http://localhost:8044/"
try:
    print("Fetching", url)
    urllib.request.urlopen(url)
    print("Server is accessible.")
except Exception as e:
    print("Error:", e)
