import { escapeHtml } from "./html";

/**
 * Branded HTML email shell.
 *
 * Email clients are hostile: no flexbox, no CSS variables, no webfonts. So this
 * is a single table with inline styles, a system font stack and a beige palette
 * that matches the site without relying on anything modern. Inter Tight is
 * listed first so Apple Mail picks it up; everywhere else falls back cleanly.
 */

const CREAM = "#f5f2eb";
const CARD = "#faf8f3";
const GREEN = "#004f36";
const INK = "#001c13";
const MUTED = "#43564d";
const RULE = "#e6e2d8";

const FONT = `'Inter Tight', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`;

export type EmailRow = {
  label: string;
  value: string;
  href?: string;
};

export type EmailAction = {
  label: string;
  href: string;
};

type Layout = {
  preheader: string;
  kicker?: string;
  title: string;
  intro?: string;
  rows?: EmailRow[];
  quote?: string;
  actions?: EmailAction[];
  footer?: string;
};

export function emailLayout(input: Layout): string {
  const rows = (input.rows ?? [])
    .map(
      (row) => `
            <tr>
              <td style="padding:14px 0;border-top:1px solid ${RULE};font:600 10px/1.4 ${FONT};letter-spacing:.14em;text-transform:uppercase;color:${MUTED};vertical-align:top;width:38%;">${escapeHtml(row.label)}</td>
              <td style="padding:14px 0;border-top:1px solid ${RULE};font:400 15px/1.5 ${FONT};color:${INK};vertical-align:top;word-break:break-word;">${
                row.href
                  ? `<a href="${escapeHtml(row.href)}" style="color:${GREEN};text-decoration:none;border-bottom:1px solid ${RULE};">${escapeHtml(row.value)}</a>`
                  : escapeHtml(row.value)
              }</td>
            </tr>`
    )
    .join("");

  const quote = input.quote
    ? `
            <tr>
              <td style="padding:22px 24px;border-top:1px solid ${RULE};">
                <div style="border-left:3px solid ${GREEN};padding:2px 0 2px 16px;font:400 15px/1.65 ${FONT};color:${INK};white-space:pre-wrap;">${escapeHtml(
                  input.quote
                )}</div>
              </td>
            </tr>`
    : "";

  const actions = (input.actions ?? [])
    .map(
      (action) => `
              <a href="${escapeHtml(action.href)}" style="display:inline-block;margin:0 8px 8px 0;padding:11px 18px;background:${GREEN};color:#faf8f3;font:600 12px/1 ${FONT};letter-spacing:.08em;text-transform:uppercase;text-decoration:none;border-radius:2px;">${escapeHtml(
        action.label
      )}</a>`
    )
    .join("");

  const actionsBlock = actions
    ? `
            <tr>
              <td style="padding:20px 24px 0;">${actions}</td>
            </tr>`
    : "";

  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(
    input.preheader
  )}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${CREAM};margin:0;padding:0;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:${CARD};border:1px solid ${RULE};">
        <tr>
          <td style="padding:26px 24px 6px;font:700 13px/1 ${FONT};letter-spacing:.22em;text-transform:uppercase;color:${GREEN};">Pekmen${
            input.kicker
              ? `<span style="color:${MUTED};font-weight:500;letter-spacing:.14em;"> &nbsp;/&nbsp; ${escapeHtml(
                  input.kicker
                )}</span>`
              : ""
          }</td>
        </tr>
        <tr>
          <td style="padding:10px 24px 0;font:600 27px/1.15 ${FONT};letter-spacing:-0.03em;color:${INK};">${escapeHtml(
            input.title
          )}</td>
        </tr>
        ${
          input.intro
            ? `<tr>
          <td style="padding:10px 24px 0;font:400 15px/1.6 ${FONT};color:${MUTED};">${escapeHtml(
            input.intro
          )}</td>
        </tr>`
            : ""
        }
        ${
          rows
            ? `<tr>
          <td style="padding:18px 24px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}
            </table>
          </td>
        </tr>`
            : ""
        }
        ${quote}
        ${actionsBlock}
        <tr>
          <td style="padding:24px;font:400 12px/1.6 ${FONT};color:${MUTED};border-top:1px solid ${RULE};margin-top:20px;">
            <div style="padding-top:0;">${escapeHtml(
              input.footer ??
                "pekmen.net — İstanbul'da full-stack geliştirici"
            )}</div>
            <div style="padding-top:10px;font:500 10px/1.4 ${FONT};letter-spacing:.16em;text-transform:uppercase;color:${MUTED};">
              <a href="https://pekmen.net" style="color:${GREEN};text-decoration:none;">pekmen.net</a>
              &nbsp;·&nbsp; İstanbul
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}
