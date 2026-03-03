import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api-client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g. "data:application/pdf;base64,")
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Génère un PDF pour une facture et l'envoie au backend pour stockage.
 * Utilise des imports dynamiques pour éviter les problèmes SSR avec @react-pdf/renderer.
 */
export function useGenerateInvoicePdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      // 1. Fetch invoice (with items), profile and client in parallel
      const [invoiceRes, profileRes] = await Promise.all([
        fetchWithAuth(`/invoices/${invoiceId}`),
        fetchWithAuth("/profile"),
      ]);

      const invoice = await invoiceRes.json();
      const profile = await profileRes.json();

      const clientRes = await fetchWithAuth(`/clients/${invoice.client_id}`);
      const client = await clientRes.json();

      // 2. Dynamic imports to avoid SSR issues with @react-pdf/renderer
      const [{ pdf }, { InvoicePDFDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/invoices/InvoicePDF"),
      ]);

      // 3. Generate PDF blob
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { createElement } = await import("react");
      // Cast needed: InvoicePDFData !== DocumentProps at type level,
      // but InvoicePDFDocument wraps a <Document> so this is safe.
      const element = createElement(InvoicePDFDocument, {
        invoice,
        client,
        profile,
      }) as Parameters<typeof pdf>[0];
      const blob = await pdf(element).toBlob();

      // 4. Convert to base64
      const pdf_base64 = await blobToBase64(blob);

      // 5. Upload to backend
      const res = await fetchWithAuth(`/invoices/${invoiceId}/pdf`, {
        method: "POST",
        body: JSON.stringify({ pdf_base64 }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de l'envoi du PDF au serveur");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

/**
 * Récupère l'URL signée du PDF d'une facture (1h de validité).
 */
export async function fetchInvoicePdfUrl(invoiceId: string): Promise<string> {
  const res = await fetchWithAuth(`/invoices/${invoiceId}/pdf`);
  if (!res.ok) throw new Error("PDF introuvable");
  const { signedUrl } = await res.json();
  return signedUrl;
}
