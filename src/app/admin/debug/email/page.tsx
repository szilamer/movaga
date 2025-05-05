'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { OrderStatus } from '@prisma/client';
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function EmailDebugPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Email Debugging Tools</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Send Test Email</CardTitle>
          </CardHeader>
          <CardContent>
            <EmailTestForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <ConfigurationCheck />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order Status Email Test</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderStatusEmailForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmailTestForm() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<OrderStatus>("PROCESSING");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/debug/send-test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          orderStatus: status,
          reinitialize: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unknown error occurred');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Recipient Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Email Template</Label>
        <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(OrderStatus).map((status) => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Sending..." : "Send Test Email"}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          <div className="flex items-start">
            {result.success ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2" />
            )}
            <div>
              <AlertTitle>{result.success ? "Success" : "Failed"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </div>
          </div>
        </Alert>
      )}
    </form>
  );
}

function OrderStatusEmailForm() {
  const [email, setEmail] = React.useState("");
  const [orderId, setOrderId] = React.useState("");
  const [status, setStatus] = React.useState<OrderStatus>("PROCESSING");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams();
      params.append('status', status);
      if (orderId) params.append('orderId', orderId);
      if (email) params.append('email', email);

      const response = await fetch(`/api/debug/test-order-status-email?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unknown error occurred');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="orderId">Order ID</Label>
          <Input
            id="orderId"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Enter order ID"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emailOverride">Override Email (Optional)</Label>
          <Input
            id="emailOverride"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Optional: Override recipient email"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="orderStatus">Order Status</Label>
        <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(OrderStatus).map((status) => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={loading || (!email && !orderId)} className="w-full">
        {loading ? "Sending..." : "Send Test Order Email"}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <div className="space-y-4">
          <Alert variant={result.success ? "default" : "destructive"}>
            <div className="flex items-start">
              {result.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2" />
              )}
              <div>
                <AlertTitle>{result.success ? "Success" : "Failed"}</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </div>
            </div>
          </Alert>

          {result.order && (
            <div className="border rounded p-4 text-sm">
              <h3 className="font-medium mb-2">Order Details</h3>
              <ul className="space-y-1">
                <li><span className="font-medium">ID:</span> {result.order.id}</li>
                <li><span className="font-medium">Status:</span> {result.order.status}</li>
                <li><span className="font-medium">Total:</span> {result.order.total}</li>
                <li><span className="font-medium">Email:</span> {result.order.userEmail || 'N/A'}</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </form>
  );
}

function ConfigurationCheck() {
  const [loading, setLoading] = React.useState(false);
  const [config, setConfig] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function checkConfiguration() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/debug/check-email-config");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unknown error occurred');
      }

      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    checkConfiguration();
  }, []);

  return (
    <div className="space-y-4">
      <Button 
        variant="outline" 
        onClick={checkConfiguration} 
        disabled={loading}
        className="w-full"
      >
        {loading ? "Checking..." : "Refresh Configuration"}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {config && (
        <div className="space-y-4">
          <Alert variant={config.status === 'complete' ? "default" : "warning"}>
            <Info className="h-4 w-4" />
            <AlertTitle>Configuration Status: {config.status}</AlertTitle>
            <AlertDescription>{config.message}</AlertDescription>
          </Alert>

          <div className="border rounded p-4">
            <h3 className="font-medium mb-2">Environment Variables</h3>
            <div className="space-y-2">
              {Object.entries(config.configuration).map(([key, value]: [string, any]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="font-mono">{key}</span>
                  <span className={`font-medium ${value.exists ? 'text-green-600' : 'text-red-600'}`}>
                    {value.exists ? (value.value || 'Set') : 'Missing'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Environment: {config.environment?.NODE_ENV || 'unknown'}</p>
            <p>Last checked: {new Date(config.timestamp).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
} 