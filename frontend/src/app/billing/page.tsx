"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Pencil,
  Trash2,
  CreditCard,
  Copy,
  MoreHorizontal,
  Download,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AppLayout from "@/components/layout/AppLayout";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import type {
  InvoiceForEdit,
  CreateInvoiceFormData,
  UpdateInvoiceFormData,
} from "@/components/invoices/InvoiceForm";
import { fetchWithAuth } from "@/lib/api-client";
import {
  useGenerateInvoicePdf,
  fetchInvoicePdfUrl,
} from "@/hooks/use-invoice-pdf";

// ─── Types ────────────────────────────────────────────────────────────────────

type InvoiceStatus = "draft" | "sent" | "overdue" | "paid" | "cancelled";

interface Invoice {
  id: string;
  client_id: string;
  invoice_number: string | null;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  total_amount: number;
  pdf_url: string | null;
  pdf_generated_at: string | null;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

type StatusConfig = {
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
};

const STATUS_CONFIG: Record<InvoiceStatus, StatusConfig> = {
  draft: {
    label: "Brouillon",
    color: "bg-muted text-muted-foreground border-border",
    icon: FileText,
  },
  sent: {
    label: "Envoyée",
    color: "bg-primary/15 text-primary border-primary/30",
    icon: Clock,
  },
  overdue: {
    label: "En retard",
    color: "bg-destructive/15 text-destructive border-destructive/30",
    icon: AlertCircle,
  },
  paid: {
    label: "Payée",
    color: "bg-success/15 text-success border-success/30",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Annulée",
    color: "bg-muted text-muted-foreground border-border/50",
    icon: FileText,
  },
};

// ─── Invoice card ─────────────────────────────────────────────────────────────

interface InvoiceCardProps {
  invoice: Invoice;
  clientName: string;
  onEdit: (invoice: Invoice, clientName: string) => void;
  onDelete: (id: string) => void;
  onPay: (id: string) => void;
  onGeneratePdf: (id: string) => void;
  onDownloadPdf: (id: string) => void;
  onViewPdf: (id: string) => void;
  isGeneratingPdf: boolean;
}

function InvoiceCard({
  invoice,
  clientName,
  onEdit,
  onDelete,
  onPay,
  onGeneratePdf,
  onDownloadPdf,
  onViewPdf,
  isGeneratingPdf,
}: InvoiceCardProps) {
  const cfg = STATUS_CONFIG[invoice.status];
  const StatusIcon = cfg.icon;
  const canDelete = invoice.status === "draft";
  const canPay =
    invoice.status === "sent" || invoice.status === "overdue";
  const hasPdf = !!invoice.pdf_url;

  return (
    <Card className="bg-gradient-card border-border/50 hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left */}
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-mono text-muted-foreground">
                {invoice.invoice_number ?? `#${invoice.id.slice(0, 8).toUpperCase()}`}
              </span>
              <Badge className={`text-xs border ${cfg.color}`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {cfg.label}
              </Badge>
              {hasPdf && (
                <Badge variant="outline" className="text-xs border-green-500/30 text-green-600 bg-green-500/10">
                  PDF
                </Badge>
              )}
            </div>
            <p className="font-semibold text-foreground truncate">
              {clientName}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Émission : {fmtDate(invoice.issue_date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Échéance : {fmtDate(invoice.due_date)}
              </span>
            </div>
          </div>

          {/* Right */}
          <div className="flex flex-col items-end gap-3 shrink-0">
            <span className="text-xl font-bold text-foreground">
              {fmtCurrency(invoice.total_amount)}
            </span>
            <div className="flex items-center gap-1.5">
              {canPay && (
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground h-8"
                  onClick={() => onPay(invoice.id)}
                >
                  <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                  Payer
                </Button>
              )}
              {hasPdf && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    title="Télécharger le PDF"
                    onClick={() => onDownloadPdf(invoice.id)}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    title="Visualiser le PDF"
                    onClick={() => onViewPdf(invoice.id)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="w-4 h-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onEdit(invoice, clientName)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onGeneratePdf(invoice.id)}
                    disabled={isGeneratingPdf}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isGeneratingPdf ? "animate-spin" : ""}`} />
                    {hasPdf ? "Regénérer le PDF" : "Générer le PDF"}
                  </DropdownMenuItem>
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        onClick={() => onDelete(invoice.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function InvoiceSkeleton() {
  return (
    <Card className="bg-gradient-card border-border/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
          <div className="flex flex-col items-end gap-3">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { value: "all", label: "Toutes" },
  { value: "draft", label: "Brouillons" },
  { value: "sent", label: "Envoyées" },
  { value: "paid", label: "Payées" },
  { value: "overdue", label: "En retard" },
  { value: "cancelled", label: "Annulées" },
] as const;

export default function BillingPage() {
  const queryClient = useQueryClient();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InvoiceForEdit | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [paymentSecret, setPaymentSecret] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [pdfViewUrl, setPdfViewUrl] = useState<string | null>(null);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery<{ data: Invoice[]; total: number }>({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await fetchWithAuth("/invoices?limit=200");
      return res.json();
    },
  });
  const invoices = data?.data ?? [];

  const { data: clientsData } = useQuery<{ data: Client[]; total: number }>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetchWithAuth("/clients?limit=100");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
  });
  const clientMap = new Map<string, string>(
    (clientsData?.data ?? []).map((c) => [c.id, c.name]),
  );

  // ── Stats ──────────────────────────────────────────────────────────────────

  const paidTotal = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.total_amount, 0);

  const sentTotal = invoices
    .filter((i) => i.status === "sent")
    .reduce((s, i) => s + i.total_amount, 0);

  const overdueTotal = invoices
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => s + i.total_amount, 0);

  const countBy = (status: InvoiceStatus) =>
    invoices.filter((i) => i.status === status).length;

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (body: CreateInvoiceFormData) => {
      const res = await fetchWithAuth("/invoices", {
        method: "POST",
        body: JSON.stringify(body),
      });
      return res.json();
    },
    onSuccess: (newInvoice) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Facture créée avec succès");
      setSheetOpen(false);
      // Auto-generate PDF after creation
      if (newInvoice?.id) {
        handleGeneratePdf(newInvoice.id);
      }
    },
    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la création de la facture",
      ),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: UpdateInvoiceFormData;
    }) => {
      const res = await fetchWithAuth(`/invoices/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Facture modifiée avec succès");
      setSheetOpen(false);
    },
    onError: () =>
      toast.error("Erreur lors de la modification de la facture"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetchWithAuth(`/invoices/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Facture supprimée");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de la facture");
      setDeleteId(null);
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`/invoices/${id}/payment-intent`, {
        method: "POST",
      });
      return res.json() as Promise<{ clientSecret: string }>;
    },
    onSuccess: (result) => setPaymentSecret(result.clientSecret),
    onError: () => toast.error("Erreur lors de la création du paiement"),
  });

  const generatePdfMutation = useGenerateInvoicePdf();

  // ── Handlers ───────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditTarget(null);
    setSheetOpen(true);
  };

  const openEdit = (invoice: Invoice, clientName: string) => {
    setEditTarget({
      id: invoice.id,
      client_id: invoice.client_id,
      client_name: clientName,
      issue_date: invoice.issue_date,
      due_date: invoice.due_date,
      status: invoice.status,
      total_amount: invoice.total_amount,
    });
    setSheetOpen(true);
  };

  const handleCreateSubmit = (data: CreateInvoiceFormData) => {
    createMutation.mutate(data);
  };

  const handleUpdateSubmit = (data: UpdateInvoiceFormData) => {
    if (!editTarget) return;
    updateMutation.mutate({ id: editTarget.id, body: data });
  };

  const handleGeneratePdf = (invoiceId: string) => {
    setGeneratingPdfId(invoiceId);
    generatePdfMutation.mutate(invoiceId, {
      onSuccess: () => {
        toast.success("PDF généré avec succès");
        setGeneratingPdfId(null);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : "Erreur lors de la génération du PDF",
        );
        setGeneratingPdfId(null);
      },
    });
  };

  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      const url = await fetchInvoicePdfUrl(invoiceId);
      const a = document.createElement("a");
      a.href = url;
      a.download = `facture-${invoiceId.slice(0, 8)}.pdf`;
      a.click();
    } catch {
      toast.error("Impossible de télécharger le PDF");
    }
  };

  const handleViewPdf = async (invoiceId: string) => {
    try {
      const url = await fetchInvoicePdfUrl(invoiceId);
      setPdfViewUrl(url);
    } catch {
      toast.error("Impossible d'afficher le PDF");
    }
  };

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filtered =
    activeTab === "all"
      ? invoices
      : invoices.filter((i) => i.status === activeTab);

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Facturation</h1>
            <p className="text-muted-foreground">
              Gérez vos factures et encaissements
            </p>
          </div>
          <Button className="bg-gradient-hero shadow-glow" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle facture
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Payées
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {fmtCurrency(paidTotal)}
              </div>
              <p className="text-xs text-muted-foreground">
                {countBy("paid")} facture
                {countBy("paid") !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En attente
              </CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {fmtCurrency(sentTotal)}
              </div>
              <p className="text-xs text-muted-foreground">
                {countBy("sent")} facture
                {countBy("sent") !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En retard
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {fmtCurrency(overdueTotal)}
              </div>
              <p className="text-xs text-muted-foreground">
                {countBy("overdue")} facture
                {countBy("overdue") !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Brouillons
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {countBy("draft")}
              </div>
              <p className="text-xs text-muted-foreground">
                non envoyée{countBy("draft") !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs + list */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="bg-muted/30 flex-wrap h-auto gap-1">
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
                {tab.value !== "all" && (
                  <span className="ml-1.5 text-xs opacity-70">
                    ({tab.value === "draft"
                      ? countBy("draft")
                      : tab.value === "sent"
                        ? countBy("sent")
                        : tab.value === "paid"
                          ? countBy("paid")
                          : tab.value === "overdue"
                            ? countBy("overdue")
                            : countBy("cancelled")})
                  </span>
                )}
                {tab.value === "all" && (
                  <span className="ml-1.5 text-xs opacity-70">
                    ({invoices.length})
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <InvoiceSkeleton key={i} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <Card className="border-border/50 bg-gradient-card">
                  <CardContent className="py-16 text-center text-muted-foreground">
                    Aucune facture dans cette catégorie.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filtered.map((invoice) => (
                    <InvoiceCard
                      key={invoice.id}
                      invoice={invoice}
                      clientName={
                        clientMap.get(invoice.client_id) ?? "Client inconnu"
                      }
                      onEdit={openEdit}
                      onDelete={setDeleteId}
                      onPay={paymentMutation.mutate}
                      onGeneratePdf={handleGeneratePdf}
                      onDownloadPdf={handleDownloadPdf}
                      onViewPdf={handleViewPdf}
                      isGeneratingPdf={generatingPdfId === invoice.id}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Create / Edit sheet */}
      <InvoiceForm
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        invoice={editTarget}
        onCreateSubmit={handleCreateSubmit}
        onUpdateSubmit={handleUpdateSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette facture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Seules les factures en brouillon
              peuvent être supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment intent dialog */}
      <Dialog
        open={!!paymentSecret}
        onOpenChange={(o) => {
          if (!o) setPaymentSecret(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lien de paiement Stripe</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Copiez ce client secret pour initialiser le paiement côté client.
            </p>
            <div className="p-3 bg-muted rounded-lg font-mono text-xs break-all select-all">
              {paymentSecret}
            </div>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(paymentSecret ?? "");
                toast.success("Client secret copié !");
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copier le client secret
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF viewer dialog */}
      <Dialog
        open={!!pdfViewUrl}
        onOpenChange={(o) => {
          if (!o) setPdfViewUrl(null);
        }}
      >
        <DialogContent className="max-w-4xl w-full h-[85vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
            <DialogTitle>Aperçu de la facture</DialogTitle>
          </DialogHeader>
          {pdfViewUrl && (
            <iframe
              src={pdfViewUrl}
              className="flex-1 w-full rounded-b-lg border-t border-border/50"
              title="Aperçu PDF"
            />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
