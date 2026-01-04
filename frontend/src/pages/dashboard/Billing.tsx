import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, Check, Download, ArrowUpRight, AlertCircle,
  Calendar, Zap, Users, Video
} from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/stores/useStore';
import { toast } from 'sonner';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 12,
    yearlyPrice: 10,
    description: 'Perfect for new creators',
    features: [
      '3 YouTube channels',
      '1,000 comments/month',
      'Basic sentiment analysis',
      'Email support',
      '7-day data retention',
    ],
    limits: {
      channels: 3,
      comments: 1000,
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 27,
    yearlyPrice: 22,
    description: 'For growing channels',
    popular: true,
    features: [
      '10 YouTube channels',
      '10,000 comments/month',
      'Advanced AI analysis',
      'Priority support',
      '30-day data retention',
      'Custom alerts',
      'Response templates',
    ],
    limits: {
      channels: 10,
      comments: 10000,
    }
  },
  {
    id: 'business',
    name: 'Business',
    price: 58,
    yearlyPrice: 48,
    description: 'For agencies & teams',
    features: [
      'Unlimited channels',
      '50,000 comments/month',
      'White-label reports',
      'Dedicated support',
      '90-day data retention',
      'Team collaboration',
      'API access',
      'Custom integrations',
    ],
    limits: {
      channels: -1,
      comments: 50000,
    }
  },
];

const billingHistory = [
  { id: '1', date: '2024-12-15', amount: 27.00, status: 'paid', invoice: 'INV-2024-0012' },
  { id: '2', date: '2024-11-15', amount: 27.00, status: 'paid', invoice: 'INV-2024-0011' },
  { id: '3', date: '2024-10-15', amount: 27.00, status: 'paid', invoice: 'INV-2024-0010' },
  { id: '4', date: '2024-09-15', amount: 27.00, status: 'paid', invoice: 'INV-2024-0009' },
  { id: '5', date: '2024-08-15', amount: 27.00, status: 'paid', invoice: 'INV-2024-0008' },
  { id: '6', date: '2024-07-15', amount: 12.00, status: 'paid', invoice: 'INV-2024-0007' },
];

export default function Billing() {
  const { user } = useStore();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const currentPlan = plans.find(p => p.id === user.plan) || plans[1];

  const handleUpgrade = (planId: string) => {
    toast.success(`Upgrading to ${planId} plan...`);
  };

  const handleDowngrade = (planId: string) => {
    toast.success(`Downgrading to ${planId} plan...`);
  };

  const handleCancelSubscription = () => {
    toast.error('Subscription cancellation requested. You will have access until the end of your billing period.');
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.success(`Downloading ${invoiceId}...`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing & Subscription</h1>
          <p className="text-muted-foreground">Manage your subscription and billing details</p>
        </div>

        {/* Current Plan Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Current Plan
                    <Badge variant="pro">{currentPlan.name}</Badge>
                  </CardTitle>
                  <CardDescription>Your subscription details and usage</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-foreground">${currentPlan.price}</p>
                  <p className="text-sm text-muted-foreground">/month</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Next billing date</p>
                    <p className="font-semibold text-foreground">January 15, 2025</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Video className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Channels used</p>
                    <p className="font-semibold text-foreground">4 / {currentPlan.limits.channels}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Comments analyzed</p>
                    <p className="font-semibold text-foreground">7,234 / {currentPlan.limits.comments.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Method */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Method
              </CardTitle>
              <CardDescription>Manage your payment details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-muted">
                    <CreditCard className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">•••• •••• •••• 4242</p>
                    <p className="text-sm text-muted-foreground">Expires 12/2026</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Update</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Plans Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Change Plan</CardTitle>
                  <CardDescription>Upgrade or downgrade your subscription</CardDescription>
                </div>
                <div className="flex items-center gap-2 p-1 rounded-lg bg-muted">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      billingCycle === 'monthly' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      billingCycle === 'yearly' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground'
                    }`}
                  >
                    Yearly <span className="text-primary">-20%</span>
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                  const isCurrent = plan.id === user.plan;
                  const price = billingCycle === 'yearly' ? plan.yearlyPrice : plan.price;
                  
                  return (
                    <div
                      key={plan.id}
                      className={`relative p-6 rounded-lg border transition-all ${
                        plan.popular 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      } ${isCurrent ? 'ring-2 ring-primary' : ''}`}
                    >
                      {plan.popular && (
                        <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">
                          Most Popular
                        </Badge>
                      )}
                      {isCurrent && (
                        <Badge variant="outline" className="absolute -top-2 right-4">
                          Current
                        </Badge>
                      )}
                      
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                      
                      <div className="mb-6">
                        <span className="text-3xl font-bold text-foreground">${price}</span>
                        <span className="text-muted-foreground">/month</span>
                        {billingCycle === 'yearly' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Billed annually (${price * 12}/year)
                          </p>
                        )}
                      </div>
                      
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="w-4 h-4 text-success" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      
                      {isCurrent ? (
                        <Button variant="outline" className="w-full" disabled>
                          Current Plan
                        </Button>
                      ) : plan.price > currentPlan.price ? (
                        <Button 
                          variant="hero" 
                          className="w-full"
                          onClick={() => handleUpgrade(plan.id)}
                        >
                          Upgrade
                          <ArrowUpRight className="w-4 h-4 ml-1" />
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleDowngrade(plan.id)}
                        >
                          Downgrade
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Billing History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>View and download your past invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Invoice</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingHistory.map((item) => (
                      <tr key={item.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-foreground">
                          {new Date(item.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{item.invoice}</td>
                        <td className="py-3 px-4 text-sm font-medium text-foreground">
                          ${item.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={item.status === 'paid' ? 'success' : 'outline'}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownloadInvoice(item.invoice)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Cancel Subscription */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                Cancel Subscription
              </CardTitle>
              <CardDescription>
                Cancel your subscription. You will have access until the end of your current billing period.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleCancelSubscription}
              >
                Cancel Subscription
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}