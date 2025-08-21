import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Download, 
  Send, 
  Eye,
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar
} from "lucide-react";

const Billing = () => {
  const invoices = [
    {
      id: "INV-2024-001",
      client: "Les Échos Urbains",
      project: "Album Indie Pop",
      amount: 2275,
      status: "paid",
      dueDate: "2024-11-15",
      paidDate: "2024-11-12",
      items: [
        { description: "Enregistrement - 4 séances", quantity: 4, rate: 80, amount: 320 },
        { description: "Mixage - 12 pistes", quantity: 12, rate: 120, amount: 1440 },
        { description: "Mastering", quantity: 1, rate: 400, amount: 400 },
        { description: "Location studio", quantity: 8, rate: 45, amount: 360 }
      ]
    },
    {
      id: "INV-2024-002", 
      client: "Neon Shadows",
      project: "EP Rock Alternative",
      amount: 1600,
      status: "pending",
      dueDate: "2024-12-20",
      items: [
        { description: "Enregistrement - 3 séances", quantity: 3, rate: 80, amount: 240 },
        { description: "Mixage - 6 pistes", quantity: 6, rate: 120, amount: 720 },
        { description: "Location studio", quantity: 6, rate: 45, amount: 270 }
      ]
    },
    {
      id: "INV-2024-003",
      client: "Crystal Dreams", 
      project: "Single Electro",
      amount: 760,
      status: "overdue",
      dueDate: "2024-11-30",
      items: [
        { description: "Mastering", quantity: 1, rate: 400, amount: 400 },
        { description: "Mix révisions", quantity: 3, rate: 120, amount: 360 }
      ]
    }
  ];

  const statusConfig = {
    paid: { label: "Payée", color: "bg-success text-success-foreground", icon: CheckCircle },
    pending: { label: "En attente", color: "bg-warning text-warning-foreground", icon: Clock },
    overdue: { label: "En retard", color: "bg-destructive text-destructive-foreground", icon: AlertCircle },
    draft: { label: "Brouillon", color: "bg-muted text-muted-foreground", icon: FileText }
  };

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingAmount = invoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const overdueAmount = invoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Facturation</h1>
          <p className="text-muted-foreground">Gérez vos devis et factures</p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" className="border-border/50">
            <FileText className="w-4 h-4 mr-2" />
            Nouveau devis
          </Button>
          <Button className="bg-gradient-hero shadow-glow">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle facture
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenus ce mois
            </CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">€{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% vs mois dernier</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En attente
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">€{pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">2 factures</p>
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
            <div className="text-2xl font-bold text-foreground">€{overdueAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">1 facture</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Factures émises
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{invoices.length}</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/30">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
          <TabsTrigger value="paid">Payées</TabsTrigger>
          <TabsTrigger value="overdue">En retard</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            {invoices.map((invoice) => {
              const statusInfo = statusConfig[invoice.status as keyof typeof statusConfig];
              const StatusIcon = statusInfo.icon;
              
              return (
                <Card key={invoice.id} className="bg-gradient-card border-border/50 hover:border-primary/30 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-foreground">{invoice.id}</h3>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        
                        <div className="text-muted-foreground">
                          <div className="font-medium">{invoice.client}</div>
                          <div className="text-sm">{invoice.project}</div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Échéance: {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}
                          </div>
                          {invoice.paidDate && (
                            <div className="flex items-center gap-1 text-success">
                              <CheckCircle className="w-3 h-3" />
                              Payée le {new Date(invoice.paidDate).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right space-y-2">
                        <div className="text-2xl font-bold text-foreground">
                          €{invoice.amount.toLocaleString()}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="border-border/50">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="border-border/50">
                            <Download className="w-4 h-4" />
                          </Button>
                          {invoice.status === 'pending' && (
                            <Button size="sm" className="bg-primary">
                              <Send className="w-4 h-4 mr-1" />
                              Envoyer
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Invoice Details */}
                    <div className="mt-4 pt-4 border-t border-border/30">
                      <div className="grid gap-2 text-sm">
                        {invoice.items.slice(0, 2).map((item, index) => (
                          <div key={index} className="flex justify-between text-muted-foreground">
                            <span>{item.description}</span>
                            <span>€{item.amount}</span>
                          </div>
                        ))}
                        {invoice.items.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{invoice.items.length - 2} autres lignes...
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Billing;