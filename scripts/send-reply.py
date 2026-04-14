import json, urllib.request, sys

with open('.env.sync') as f:
    lines = f.read().strip().split('\n')
env = {}
for l in lines:
    k, v = l.split('=', 1)
    env[k] = v.strip('"')

url = env['WORKER_URL'] + '/api/reply'
msg = sys.argv[1] if len(sys.argv) > 1 else 'Sync done'
data = json.dumps({'text': msg, 'parse_mode': 'Markdown'}).encode()
req = urllib.request.Request(
    url, data=data,
    headers={
        'Authorization': 'Bearer ' + env['SYNC_API_KEY'],
        'Content-Type': 'application/json',
        'User-Agent': 'beatnonstop-sync/1.0'
    },
    method='POST'
)
resp = urllib.request.urlopen(req)
print(resp.read().decode())
