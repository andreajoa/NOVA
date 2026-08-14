import { NextResponse } from "next/server";
import {
  ensureCrmTables,
  upsertContact,
  enrollContact,
  isSuppressed,
  isValidEmail,
  normalizeEmail,
} from "@/lib/crm/db";
import { requireCrmAdmin } from "@/lib/crm/guard";
import { normalizeLocale } from "@/lib/crm/render";
import { SEQUENCE_ID } from "@/lib/crm/sequence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const MAX_ROWS = 5000;

/** Parser de CSV suficiente para listas de contato (aspas e vírgula dentro de campo). */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') inQuotes = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((line) => line.some((cell) => String(cell).trim() !== ""));
}

function columnIndex(header, names) {
  for (const name of names) {
    const index = header.findIndex((cell) => cell.trim().toLowerCase() === name);
    if (index !== -1) return index;
  }
  return -1;
}

export async function POST(request) {
  const guard = await requireCrmAdmin();
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => ({}));

  // Registro de proveniência. Fica gravado em cada contato: se a lista der
  // problema de reclamação depois, dá para saber de qual importação ela veio.
  const listName = String(body.listName || "").trim();
  if (!listName) {
    return NextResponse.json(
      { error: "listName é obrigatório — identifica a origem desta lista nos contatos importados." },
      { status: 400 }
    );
  }

  if (body.consentConfirmed !== true) {
    return NextResponse.json(
      {
        error: "CONSENT_NOT_CONFIRMED",
        message:
          "Confirme que estes contatos pediram para receber e-mail seu (consentConfirmed: true). " +
          "Lista comprada ou raspada gera reclamação de spam, e reclamação acima de 0,3% bloqueia o domínio novvideos.online inteiro — inclusive os e-mails transacionais.",
      },
      { status: 400 }
    );
  }

  const enroll = body.enroll !== false;
  const defaultLocale = normalizeLocale(body.locale || "en");

  let records = [];

  if (Array.isArray(body.contacts)) {
    records = body.contacts;
  } else if (typeof body.csv === "string" && body.csv.trim()) {
    const rows = parseCsv(body.csv);
    if (!rows.length) {
      return NextResponse.json({ error: "CSV vazio" }, { status: 400 });
    }

    const header = rows[0].map((cell) => String(cell));
    const emailIdx = columnIndex(header, ["email", "e-mail", "email_address", "endereco"]);

    if (emailIdx === -1) {
      return NextResponse.json(
        { error: "CSV precisa de uma coluna 'email' no cabeçalho." },
        { status: 400 }
      );
    }

    const firstIdx = columnIndex(header, ["first_name", "firstname", "nome", "name"]);
    const lastIdx = columnIndex(header, ["last_name", "lastname", "sobrenome"]);
    const localeIdx = columnIndex(header, ["locale", "language", "idioma", "lang"]);

    records = rows.slice(1).map((cells) => ({
      email: cells[emailIdx],
      firstName: firstIdx === -1 ? "" : cells[firstIdx],
      lastName: lastIdx === -1 ? "" : cells[lastIdx],
      locale: localeIdx === -1 ? "" : cells[localeIdx],
    }));
  } else {
    return NextResponse.json(
      { error: "Envie `csv` (texto) ou `contacts` (array)." },
      { status: 400 }
    );
  }

  if (records.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Máximo de ${MAX_ROWS} contatos por importação. Divida o arquivo.` },
      { status: 400 }
    );
  }

  await ensureCrmTables();

  const result = { received: records.length, imported: 0, enrolled: 0, skipped: [], invalid: [] };
  const seen = new Set();

  for (const record of records) {
    const email = normalizeEmail(record.email);

    if (!isValidEmail(email)) {
      result.invalid.push(String(record.email || "").slice(0, 120));
      continue;
    }

    if (seen.has(email)) continue;
    seen.add(email);

    // Quem já saiu da lista não volta por importação. Reinscrever alguém que
    // descadastrou é o caminho mais rápido para uma reclamação de spam.
    if (await isSuppressed(email)) {
      result.skipped.push({ email, reason: "suppressed" });
      continue;
    }

    try {
      const contact = await upsertContact({
        email,
        firstName: String(record.firstName || "").trim(),
        lastName: String(record.lastName || "").trim(),
        locale: normalizeLocale(record.locale || defaultLocale),
        source: "import",
        tags: listName,
      });

      result.imported += 1;

      if (enroll && contact?.id && contact.status === "subscribed") {
        await enrollContact(contact.id, SEQUENCE_ID, 0);
        result.enrolled += 1;
      }
    } catch (error) {
      result.skipped.push({ email, reason: String(error?.message || error).slice(0, 160) });
    }
  }

  console.log("[crm] import", { listName, ...result, skipped: result.skipped.length });

  return NextResponse.json({
    ok: true,
    listName,
    ...result,
    skipped: result.skipped.slice(0, 100),
    invalid: result.invalid.slice(0, 100),
  });
}
