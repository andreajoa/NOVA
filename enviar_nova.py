#!/usr/bin/env python3
"""
Disparo manual de campanha via Resend.

SUPERSEDIDO pelo CRM (src/lib/crm) — prefira importar a lista em
/dashboard/admin/crm, que respeita supressão, descadastro e reclamação.
Este script fica aqui só para disparo pontual.

Uso:
    export RESEND_API_KEY="re_..."
    python3 enviar_nova.py destinatarios.txt /tmp/nova_email.html

O arquivo de destinatários é um e-mail por linha e NÃO fica no repositório:
endereço de cliente é dado pessoal e este repositório é público.
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request

API_KEY = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL = os.environ.get("CRM_FROM_EMAIL", "NOVA AI Studio <noreply@novvideos.online>")
SUBJECT = os.environ.get(
    "CAMPAIGN_SUBJECT", "Create stunning product images & videos — AI in seconds"
)


def load_recipients(path):
    with open(path, encoding="utf-8") as handle:
        return [line.strip() for line in handle if line.strip() and "@" in line]


def send_email(to_email, html_body):
    payload = json.dumps(
        {"from": FROM_EMAIL, "to": [to_email], "subject": SUBJECT, "html": html_body}
    ).encode("utf-8")

    request = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return True, json.loads(response.read().decode()).get("id", "ok")
    except urllib.error.HTTPError as error:
        return False, f"HTTP {error.code}: {error.read().decode()}"
    except Exception as error:  # noqa: BLE001
        return False, str(error)


def main():
    if not API_KEY:
        sys.exit("RESEND_API_KEY não definida. Rode: export RESEND_API_KEY=...")

    if len(sys.argv) < 3:
        sys.exit(f"Uso: {sys.argv[0]} <arquivo_destinatarios> <arquivo_html>")

    recipients = load_recipients(sys.argv[1])

    with open(sys.argv[2], encoding="utf-8") as handle:
        html_body = handle.read()

    if not recipients:
        sys.exit("Nenhum destinatário válido no arquivo.")

    print(f"\nNOVA — disparo de campanha")
    print(f"Total: {len(recipients)} destinatários")
    print(f"De: {FROM_EMAIL}")
    print("-" * 55)

    ok = 0
    errors = []

    for index, email in enumerate(recipients, 1):
        success, info = send_email(email, html_body)

        if success:
            ok += 1
            print(f"OK   [{index:03d}/{len(recipients)}] {email}")
        else:
            errors.append((email, info))
            print(f"FAIL [{index:03d}/{len(recipients)}] {email} -> {info}")

        if index < len(recipients):
            time.sleep(0.5)

    print("-" * 55)
    print(f"\nEnviados: {ok}   Falhas: {len(errors)}")

    for email, error in errors:
        print(f"  - {email}: {error}")


if __name__ == "__main__":
    main()
