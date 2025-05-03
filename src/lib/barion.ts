import axios from 'axios';

// Barion API endpoints
const BARION_API_BASE = 'https://api.test.barion.com/v2';
const BARION_PAYMENT_BASE = 'https://secure.test.barion.com/Pay';

// Types
export interface BarionPaymentRequest {
  POSKey: string;
  PaymentType: 'Immediate' | 'Reservation' | 'DelayedCapture';
  ReservationPeriod: string; // TimeSpan format: HH:mm:ss
  DelayedCapturePeriod: string; // TimeSpan format: HH:mm:ss
  PaymentWindow: string; // TimeSpan format: HH:mm:ss
  GuestCheckOut: boolean;
  InitiateRecurrence: boolean;
  RecurrenceType: string;
  RecurrenceId: string;
  FundingSources: string[];
  PaymentRequestId: string;
  PayerHint: string;
  CardHolderNameHint: string;
  Items: BarionItem[];
  ShippingAddress: BarionAddress;
  BillingAddress: BarionAddress;
  RedirectUrl: string;
  CallbackUrl: string;
  Currency: string;
  Transactions: BarionTransaction[];
}

export interface BarionItem {
  Name: string;
  Description: string;
  Quantity: number;
  Unit: string;
  UnitPrice: number;
  ItemTotal: number;
  SKU: string;
}

export interface BarionAddress {
  Country: string;
  City: string;
  Zip: string;
  Street: string;
  Street2?: string;
  Street3?: string;
  FullName: string;
}

export interface BarionTransaction {
  POSTransactionId: string;
  Payee: string;
  Total: number;
  Comment: string;
  Items: BarionItem[];
}

interface BarionResponse {
  Status: string;
  PaymentId?: string;
  GatewayUrl?: string;
  [key: string]: any;
}

export class BarionService {
  private posKey: string;
  private isTestMode: boolean;

  constructor(posKey?: string, isTestMode: boolean = true) {
    this.posKey = posKey || process.env.BARION_POS_KEY || 'fab5fa17-77a6-4cf6-a5ae-a5cb81e264d8';
    if (!this.posKey) {
      console.error('POS Key is not provided for BarionService and environment variable is not set');
      throw new Error('POS Key is required for BarionService');
    }
    this.isTestMode = isTestMode;
    console.log('BarionService initialized with POS Key length:', this.posKey?.length || 0);
  }

  private getApiBase(): string {
    return this.isTestMode 
      ? 'https://api.test.barion.com/v2'
      : 'https://api.barion.com/v2';
  }

  private getPaymentBase(): string {
    return this.isTestMode
      ? 'https://secure.test.barion.com/Pay'
      : 'https://secure.barion.com/Pay';
  }

  async startPayment(paymentRequest: BarionPaymentRequest): Promise<string> {
    try {
      console.log('Starting payment with POS Key:', this.posKey);
      console.log('Payment request:', JSON.stringify(paymentRequest, null, 2));

      const requestData = {
        ...paymentRequest,
        POSKey: this.posKey,
      };

      console.log('Full request data:', JSON.stringify(requestData, null, 2));

      const response = await axios.post<BarionResponse>(
        `${this.getApiBase()}/Payment/Start`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      console.log('Payment response:', response.data);

      // Handle Prepared status - return GatewayUrl for redirection
      if (response.data.Status === 'Prepared' && response.data.GatewayUrl) {
        return response.data.GatewayUrl;
      }

      // Handle Succeeded status (less common for direct /Start call with redirect)
      if (response.data.Status === 'Succeeded' && response.data.PaymentId) {
        // Potentially redirect to a success page immediately or return PaymentId
        // For now, let's assume GatewayUrl is preferred if available even on Succeeded
        // or handle based on specific needs. Returning PaymentBase + ID might be incorrect.
        // Let's prioritize GatewayUrl if present, otherwise throw error.
        if (response.data.GatewayUrl) {
             return response.data.GatewayUrl;
        } else {
            // This case might need specific handling if Succeeded without GatewayUrl occurs
            console.warn('Payment Succeeded but no GatewayUrl, returning PaymentId link. Review logic if needed.');
            return `${this.getPaymentBase()}/${response.data.PaymentId}`;
        }
      }

      // Log the full response details when status is neither Prepared nor Succeeded
      console.error('Payment start unsuccessful or unexpected status. Full response:', JSON.stringify(response.data, null, 2));
      throw new Error(`Payment start failed with status: ${response.data.Status || 'Unknown'}`);
    } catch (error: any) {
      console.error('Barion payment error:', error);
      // Check if it looks like an Axios error by checking for response property
      if (error && error.response && error.response.data) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        if (error.config) { // Check if config exists
          console.error('Request config:', error.config);
        }

        // Részletes hibaüzenetek kiírása
        if (error.response.data.Errors) {
          console.error('Detailed error messages:');
          error.response.data.Errors.forEach((err: any, index: number) => {
            console.error(`Error ${index + 1}:`, err);
          });
        }
      } else if (error instanceof Error) {
        // Handle non-Axios errors that are instances of Error
        console.error('Non-Axios Error Message:', error.message);
      }
      throw error;
    }
  }

  async getPaymentState(paymentId: string): Promise<BarionResponse> {
    try {
      const response = await axios.get<BarionResponse>(`${BARION_API_BASE}/Payment/GetPaymentState`, {
        params: {
          POSKey: this.posKey,
          PaymentId: paymentId,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Barion payment state error:', error);
      throw error;
    }
  }

  async finishReservation(paymentId: string, amount: number): Promise<BarionResponse> {
    try {
      const response = await axios.post<BarionResponse>(`${BARION_API_BASE}/Payment/FinishReservation`, {
        POSKey: this.posKey,
        PaymentId: paymentId,
        Amount: amount,
      });

      return response.data;
    } catch (error) {
      console.error('Barion finish reservation error:', error);
      throw error;
    }
  }

  async cancelPayment(paymentId: string): Promise<BarionResponse> {
    try {
      const response = await axios.post<BarionResponse>(`${BARION_API_BASE}/Payment/Cancel`, {
        POSKey: this.posKey,
        PaymentId: paymentId,
      });

      return response.data;
    } catch (error) {
      console.error('Barion cancel payment error:', error);
      throw error;
    }
  }
} 