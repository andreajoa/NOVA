import urllib.request
import urllib.error
import json
import time

RESEND_API_KEY = "re_WRDv2VxB_G1t5mtXTACTC3v12to4zZWW1"
FROM_EMAIL = "NOVA AI Studio <noreply@novvideos.online>"
SUBJECT = "Create stunning product images & videos — AI in seconds"

EMAILS = [
    "saifshakeel032@gmail.com",
    "475277864@qq.com",
    "polkadot.girl.101@gmail.com",
    "likyujyth@qq.com",
    "youqisi1314@gmail.com",
    "amengd31@gmail.com",
    "592272755@qq.com",
    "debzpamyde@oiyyjkfy.xyz",
    "haavshsbs@gmail.com",
    "ceciliashajan827@gmail.com",
    "dserewfwfe@gmx.com",
    "kanesoko@gmail.com",
    "1004hoobin1004@gmail.com",
    "ypangzhi@gmail.com",
    "uzut31@cartolina.net",
    "hibij18492@4nly.com",
    "mazengoherman@gmail.com",
    "piktras8@gmail.com",
    "krays7490@gmail.com",
    "alabimustafa06@gmail.com",
    "ivankulson1@gmail.com",
    "yonsmhmd39@gmail.com",
    "kozuranibal@gmail.com",
    "weitongxue93@gmail.com",
    "kifflom033@gmail.com",
    "luizhenriquemaia123321@gmail.com",
    "ljimmy@seznam.cz",
    "valuesdrama@gmail.com",
    "kkxx59946@gmail.com",
    "sidhishah9799@gmail.com",
    "iqbalmw4@gmail.com",
    "tinhluc02@gmail.com",
    "yxs01012qq@gmail.com",
    "tdahma2@gmail.com",
    "andremuseu@gmail.com",
    "andrezohoemail@gmail.com",
    "anamacielboutique@gmail.com",
]

HTML_BODY = open("/tmp/nova_email.html").read()

def send_email(to_email):
    payload = json.dumps({
        "from": FROM_EMAIL,
        "to": [to_email],
        "subject": SUBJECT,
        "html": HTML_BODY,
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode())
            return True, result.get("id", "ok")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return False, f"HTTP {e.code}: {body}"
    except Exception as e:
        return False, str(e)

def main():
    print(f"\n🚀 NOVA Email Marketing")
    print(f"📧 Total: {len(EMAILS)} destinatários")
    print(f"📤 De: {FROM_EMAIL}")
    print("-" * 55)
    ok = 0
    fail = 0
    errors = []
    for i, email in enumerate(EMAILS, 1):
        success, info = send_email(email)
        if success:
            ok += 1
            print(f"✅ [{i:02d}/{len(EMAILS)}] {email}")
        else:
            fail += 1
            errors.append((email, info))
            print(f"❌ [{i:02d}/{len(EMAILS)}] {email} → {info}")
        if i < len(EMAILS):
            time.sleep(0.5)
    print("-" * 55)
    print(f"\n✅ Enviados: {ok}  ❌ Falhas: {fail}")
    if errors:
        print("\nErros:")
        for em, err in errors:
            print(f"  • {em}: {err}")
    print("\n🎉 Campanha concluída!")

if __name__ == "__main__":
    main()
