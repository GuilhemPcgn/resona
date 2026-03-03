import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoicePDFData {
  invoice: {
    id: string;
    invoice_number: string | null;
    issue_date: string;
    due_date: string;
    status: string;
    total_amount: number;
    tax_rate?: number | null;
    tax_amount?: number | null;
    subtotal?: number | null;
    invoice_items: Array<{
      description: string;
      quantity: number | null;
      unit_price: number;
      total_price: number;
    }>;
  };
  client: {
    name: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    location?: string | null;
  };
  profile: {
    first_name?: string | null;
    last_name?: string | null;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const C = {
  primary: "#7c3aed",
  dark: "#0f0f0f",
  gray: "#6b7280",
  lightGray: "#f3f4f6",
  border: "#e5e7eb",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: C.white,
    paddingHorizontal: 48,
    paddingTop: 48,
    paddingBottom: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.dark,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 36,
  },
  studioBlock: {
    flexDirection: "column",
    gap: 2,
  },
  studioName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
  },
  studioMeta: {
    fontSize: 9,
    color: C.gray,
    marginTop: 2,
  },
  invoiceBlock: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 2,
  },
  invoiceTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
    letterSpacing: 2,
  },
  invoiceNumber: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
    marginTop: 4,
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginBottom: 24,
  },
  // Addresses block
  addressesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 36,
  },
  addressBlock: {
    flexDirection: "column",
    width: "45%",
  },
  addressLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.gray,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  addressName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
    marginBottom: 2,
  },
  addressLine: {
    fontSize: 9,
    color: C.gray,
    marginBottom: 1,
  },
  // Dates
  datesRow: {
    flexDirection: "row",
    gap: 24,
  },
  dateItem: {
    flexDirection: "column",
  },
  dateLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 10,
    color: C.dark,
  },
  // Table
  table: {
    flexDirection: "column",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.lightGray,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 0,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  colDesc: { flex: 1 },
  colQty: { width: 50, textAlign: "right" },
  colPrice: { width: 80, textAlign: "right" },
  colTotal: { width: 80, textAlign: "right" },
  thText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tdText: {
    fontSize: 10,
    color: C.dark,
  },
  tdMuted: {
    fontSize: 10,
    color: C.gray,
  },
  // Totals
  totalsBlock: {
    flexDirection: "column",
    alignItems: "flex-end",
    marginBottom: 32,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 240,
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 10,
    color: C.gray,
  },
  totalValue: {
    fontSize: 10,
    color: C.dark,
  },
  totalDivider: {
    height: 1,
    backgroundColor: C.border,
    width: 240,
    marginVertical: 6,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 240,
    paddingVertical: 4,
    backgroundColor: C.lightGray,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginTop: 2,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.dark,
  },
  grandTotalValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.primary,
  },
  // Status badge
  statusBadge: {
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 99,
    backgroundColor: C.lightGray,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Footer
  footer: {
    marginTop: "auto",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  footerText: {
    fontSize: 8,
    color: C.gray,
    textAlign: "center",
    lineHeight: 1.5,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  overdue: "En retard",
  paid: "Payée",
  cancelled: "Annulée",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function InvoicePDFDocument({
  invoice,
  client,
  profile,
}: InvoicePDFData) {
  const studioName =
    profile.company ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    "Studio";

  const subtotal =
    invoice.subtotal ??
    invoice.invoice_items.reduce((s, i) => s + (i.quantity ?? 1) * i.unit_price, 0);

  const taxRate = invoice.tax_rate ?? 0;
  const taxAmount = invoice.tax_amount ?? subtotal * (taxRate / 100);
  const hasTax = taxRate > 0;

  return (
    <Document
      title={`Facture ${invoice.invoice_number ?? invoice.id.slice(0, 8).toUpperCase()}`}
      author={studioName}
    >
      <Page size="A4" style={styles.page}>
        {/* ── Header ───────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.studioBlock}>
            <Text style={styles.studioName}>{studioName}</Text>
            {profile.email && (
              <Text style={styles.studioMeta}>{profile.email}</Text>
            )}
            {profile.phone && (
              <Text style={styles.studioMeta}>{profile.phone}</Text>
            )}
          </View>
          <View style={styles.invoiceBlock}>
            <Text style={styles.invoiceTitle}>FACTURE</Text>
            <Text style={styles.invoiceNumber}>
              {invoice.invoice_number ??
                `#${invoice.id.slice(0, 8).toUpperCase()}`}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── Addresses + Dates ─────────────────────────────────────── */}
        <View style={styles.addressesRow}>
          {/* Client */}
          <View style={styles.addressBlock}>
            <Text style={styles.addressLabel}>Facturé à</Text>
            <Text style={styles.addressName}>
              {client.company || client.name}
            </Text>
            {client.company && (
              <Text style={styles.addressLine}>{client.name}</Text>
            )}
            {client.email && (
              <Text style={styles.addressLine}>{client.email}</Text>
            )}
            {client.phone && (
              <Text style={styles.addressLine}>{client.phone}</Text>
            )}
            {client.location && (
              <Text style={styles.addressLine}>{client.location}</Text>
            )}
          </View>

          {/* Dates */}
          <View style={styles.addressBlock}>
            <Text style={styles.addressLabel}>Détails</Text>
            <View style={styles.datesRow}>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Émission</Text>
                <Text style={styles.dateValue}>{fmtDate(invoice.issue_date)}</Text>
              </View>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Échéance</Text>
                <Text style={styles.dateValue}>{fmtDate(invoice.due_date)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Status badge ──────────────────────────────────────────── */}
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {STATUS_LABELS[invoice.status] ?? invoice.status}
          </Text>
        </View>

        {/* ── Items table ───────────────────────────────────────────── */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <View style={styles.colDesc}>
              <Text style={styles.thText}>Description</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={styles.thText}>Qté</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.thText}>Prix HT</Text>
            </View>
            <View style={styles.colTotal}>
              <Text style={styles.thText}>Total HT</Text>
            </View>
          </View>

          {/* Rows */}
          {invoice.invoice_items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={styles.tdText}>{item.description}</Text>
              </View>
              <View style={styles.colQty}>
                <Text style={styles.tdMuted}>{item.quantity ?? 1}</Text>
              </View>
              <View style={styles.colPrice}>
                <Text style={styles.tdMuted}>{fmtCurrency(item.unit_price)}</Text>
              </View>
              <View style={styles.colTotal}>
                <Text style={styles.tdText}>
                  {fmtCurrency(item.total_price)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Totals ────────────────────────────────────────────────── */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total HT</Text>
            <Text style={styles.totalValue}>{fmtCurrency(subtotal)}</Text>
          </View>
          {hasTax && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TVA ({taxRate}%)</Text>
              <Text style={styles.totalValue}>{fmtCurrency(taxAmount)}</Text>
            </View>
          )}
          <View style={styles.totalDivider} />
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>
              {hasTax ? "TOTAL TTC" : "TOTAL HT"}
            </Text>
            <Text style={styles.grandTotalValue}>
              {fmtCurrency(invoice.total_amount)}
            </Text>
          </View>
        </View>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {studioName}
            {profile.email ? ` · ${profile.email}` : ""}
            {profile.phone ? ` · ${profile.phone}` : ""}
            {"\n"}
            Facture générée électroniquement — valable sans signature
          </Text>
        </View>
      </Page>
    </Document>
  );
}
