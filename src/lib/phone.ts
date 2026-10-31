const OPT_OUT_DEFAULT = ["sair", "parar", "stop", "cancelar", "descadastrar"];

export function normalizePhone(input: string): string | null {
  const digits = String(input || "").replace(/\D/g, "");
  if (!digits) return null;

  let phone = digits;
  if (phone.startsWith("00")) phone = phone.slice(2);
  if (phone.length === 10 || phone.length === 11) phone = `55${phone}`;
  if (phone.length === 12 && phone.startsWith("55")) {
    phone = `${phone.slice(0, 4)}9${phone.slice(4)}`;
  }
  if (!/^55\d{11}$/.test(phone)) return null;
  return phone;
}

export function formatPhone(phone: string): string {
  const n = normalizePhone(phone) ?? phone.replace(/\D/g, "");
  if (n.length !== 13) return phone;
  return `+${n.slice(0, 2)} (${n.slice(2, 4)}) ${n.slice(4, 9)}-${n.slice(9)}`;
}

export function interpolateMessage(
  template: string,
  contact: {
    name?: string | null;
    company?: string | null;
    city?: string | null;
    phone?: string | null;
  },
): string {
  const first = (contact.name || "").trim().split(/\s+/)[0] || "";
  return template
    .replaceAll("{{nome}}", contact.name || "")
    .replaceAll("{{primeiro_nome}}", first)
    .replaceAll("{{empresa}}", contact.company || "")
    .replaceAll("{{cidade}}", contact.city || "")
    .replaceAll("{{telefone}}", contact.phone ? formatPhone(contact.phone) : "");
}

export function isOptOutKeyword(text: string, keywords = OPT_OUT_DEFAULT): boolean {
  const value = text.trim().toLowerCase();
  return keywords.some((word) => value === word || value.startsWith(`${word} `));
}

export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => normalizeHeader(h));
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = (cells[index] || "").trim();
    });
    return row;
  });
}

function normalizeHeader(header: string): string {
  const key = header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  if (["nome", "name"].includes(key)) return "name";
  if (["telefone", "phone", "whatsapp", "celular"].includes(key)) return "phone";
  if (["email", "e-mail"].includes(key)) return "email";
  if (["empresa", "company"].includes(key)) return "company";
  if (["cidade", "city"].includes(key)) return "city";
  if (["tags", "etiquetas"].includes(key)) return "tags";
  if (["optin", "opt_in", "opt-in", "consentimento"].includes(key)) return "opt_in";
  return key;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (ch === "," && !quoted) {
      out.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out;
}
