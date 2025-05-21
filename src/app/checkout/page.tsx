'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useCart } from '@/store/cart'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { ShippingMethod } from '@prisma/client'
import { BarionService, BarionPaymentRequest } from '@/lib/barion'
import Link from 'next/link'

const PAYMENT_METHODS = {
  // BARION: { name: 'Barion online fizetés', fee: 0 }, // Temporarily disabled until token is available
  CASH_ON_DELIVERY: { name: 'Utánvét', fee: 500 },
  BANK_TRANSFER: { name: 'Banki átutalás', fee: 0 },
} as const

interface AddressFormValues {
  // Shipping address
  shippingFullName: string;
  shippingCountry: string;
  shippingCity: string;
  shippingAddress: string;
  shippingZipCode: string;
  shippingPhone: string;
  shippingEmail: string;

  // Billing address
  billingFullName: string;
  billingCountry: string;
  billingCity: string;
  billingAddress: string;
  billingZipCode: string;
  billingPhone: string;
  billingCompanyName?: string;
  billingTaxNumber?: string;

  sameAsShipping: boolean;
  isCompany: boolean;
}

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { items, getTotal, clearCart } = useCart()
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<keyof typeof PAYMENT_METHODS>('BANK_TRANSFER')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<'address' | 'shipping' | 'payment'>('address')
  const [sameAsShipping, setSameAsShipping] = useState(true)
  const [isCompany, setIsCompany] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<AddressFormValues>({
    defaultValues: {
      shippingFullName: '',
      shippingCountry: 'Magyarország',
      shippingCity: '',
      shippingAddress: '',
      shippingZipCode: '',
      shippingPhone: '',
      shippingEmail: session?.user?.email || '',
      
      billingFullName: '',
      billingCountry: 'Magyarország',
      billingCity: '',
      billingAddress: '',
      billingZipCode: '',
      billingPhone: '',
      
      sameAsShipping: true,
      isCompany: false
    }
  })

  // Bejelentkezés ellenőrzése
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Vendég vásárlás esetén nem irányítunk át
      return;
    }
  }, [status, router])

  // Korábban mentett címadatok lekérése bejelentkezett felhasználók esetén
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      // Címadatok lekérése API-n keresztül
      const fetchUserAddresses = async () => {
        try {
          const response = await fetch('/api/users/addresses', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          })

          if (response.ok) {
            const data = await response.json()
            
            // Szállítási cím beállítása
            if (data.shippingAddress) {
              setValue('shippingFullName', data.shippingAddress.fullName)
              setValue('shippingCountry', data.shippingAddress.country)
              setValue('shippingCity', data.shippingAddress.city)
              setValue('shippingAddress', data.shippingAddress.address)
              setValue('shippingZipCode', data.shippingAddress.zipCode)
              setValue('shippingPhone', data.shippingAddress.phone || '')
            }
            
            // Számlázási cím beállítása
            if (data.billingAddress) {
              setValue('billingFullName', data.billingAddress.fullName)
              setValue('billingCountry', data.billingAddress.country)
              setValue('billingCity', data.billingAddress.city)
              setValue('billingAddress', data.billingAddress.address)
              setValue('billingZipCode', data.billingAddress.zipCode)
              setValue('billingPhone', data.billingAddress.phone || '')
              
              if (data.billingAddress.companyName) {
                setValue('billingCompanyName', data.billingAddress.companyName)
                setValue('billingTaxNumber', data.billingAddress.taxNumber)
                setValue('isCompany', true)
                setIsCompany(true)
              }
              
              // Ellenőrizzük, hogy a számlázási és szállítási cím megegyezik-e
              const shippingEqualsBilling = 
                data.shippingAddress && 
                data.billingAddress &&
                data.shippingAddress.fullName === data.billingAddress.fullName &&
                data.shippingAddress.country === data.billingAddress.country &&
                data.shippingAddress.city === data.billingAddress.city &&
                data.shippingAddress.address === data.billingAddress.address &&
                data.shippingAddress.zipCode === data.billingAddress.zipCode
                
              setValue('sameAsShipping', shippingEqualsBilling)
              setSameAsShipping(shippingEqualsBilling)
            }
          }
        } catch (error) {
          console.error('Címadatok lekérési hiba:', error)
        }
      }

      fetchUserAddresses()
    }
  }, [status, session, setValue])

  // Add useEffect to fetch shipping methods
  useEffect(() => {
    const fetchShippingMethods = async () => {
      try {
        const response = await fetch('/api/shipping-methods')
        if (!response.ok) {
          throw new Error('Hiba történt a szállítási módok betöltése során')
        }
        const data = await response.json()
        setShippingMethods(data)
        if (data.length > 0) {
          setSelectedShippingMethod(data[0])
        }
      } catch (error) {
        console.error('Error loading shipping methods:', error)
        toast.error('Hiba történt a szállítási módok betöltése során')
      }
    }

    fetchShippingMethods()
  }, [])

  // Ha nincs bejelentkezve, akkor is engedjük tovább
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  // Kosár ellenőrzése
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">A kosár üres</h1>
          <p className="mb-8 text-gray-600">
            Még nem adtál hozzá termékeket a kosaradhoz.
          </p>
          <Link
            href="/products"
            className="inline-block rounded-lg bg-primary px-8 py-3 font-medium text-white transition-colors hover:bg-primary/90"
          >
            Vásárlás folytatása
          </Link>
        </div>
      </div>
    )
  }

  const subtotal = getTotal()
  const shippingCost = selectedShippingMethod?.price || 0
  const total = subtotal + shippingCost

  const handleAddressSubmit = (data: AddressFormValues) => {
    // Következő lépésre lépés
    setStep('shipping')
    
    // Ha bejelentkezett felhasználó, mentjük a címadatokat
    if (session?.user?.id) {
      saveUserAddresses(data)
    }
  }

  const saveUserAddresses = async (data: AddressFormValues) => {
    try {
      const response = await fetch('/api/users/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          shippingAddress: {
            fullName: data.shippingFullName,
            country: data.shippingCountry,
            city: data.shippingCity,
            address: data.shippingAddress,
            zipCode: data.shippingZipCode,
            phone: data.shippingPhone
          },
          billingAddress: {
            fullName: data.sameAsShipping ? data.shippingFullName : data.billingFullName,
            country: data.sameAsShipping ? data.shippingCountry : data.billingCountry,
            city: data.sameAsShipping ? data.shippingCity : data.billingCity,
            address: data.sameAsShipping ? data.shippingAddress : data.billingAddress,
            zipCode: data.sameAsShipping ? data.shippingZipCode : data.billingZipCode,
            phone: data.sameAsShipping ? data.shippingPhone : data.billingPhone,
            companyName: data.isCompany ? data.billingCompanyName : null,
            taxNumber: data.isCompany ? data.billingTaxNumber : null
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Hiba történt a címadatok mentése során')
      }
    } catch (error) {
      console.error('Címadatok mentési hiba:', error)
      toast.error('Hiba történt a címadatok mentése során')
    }
  }

  const handleSubmitOrder = async () => {
    if (!selectedShippingMethod?.id) {
      toast.error('Kérjük, válassz szállítási módot a rendelés leadásához!');
      return;
    }
    try {
      setIsSubmitting(true)

      // Címadatok lekérése az űrlapból
      const formData = watch()

      // Ha Barion fizetést választott
      /* Temporarily disabled until token is available
      if (paymentMethod === 'BARION') {
        // Közvetlen POS key használata fallback értékként
        const posKey = 'fab5fa17-77a6-4cf6-a5ae-a5cb81e264d8';
        console.log('Using hardcoded POS Key for client');

        const barionService = new BarionService(posKey, true);
        
        // Generate a unique payment ID
        const paymentRequestId = `PAY-${Date.now()}`;
        
        const paymentRequest: BarionPaymentRequest = {
          POSKey: posKey,
          PaymentType: 'Immediate',
          ReservationPeriod: '00:01:00', // Minimum 1 perc
          DelayedCapturePeriod: '00:01:00', // Minimum 1 perc
          PaymentWindow: '00:30:00', // 30 perc
          GuestCheckOut: true,
          InitiateRecurrence: false,
          RecurrenceType: '',
          RecurrenceId: '',
          FundingSources: ['All'],
          PaymentRequestId: paymentRequestId,
          PayerHint: '',
          CardHolderNameHint: '',
          Items: items.map(item => ({
            Name: item.name,
            Description: item.description || '',
            Quantity: item.quantity,
            Unit: 'piece',
            UnitPrice: item.price,
            ItemTotal: item.price * item.quantity,
            SKU: item.id.toString(),
          })),
          ShippingAddress: {
            Country: 'HU',
            City: formData.shippingCity,
            Zip: formData.shippingZipCode,
            Street: formData.shippingAddress,
            FullName: formData.shippingFullName,
          },
          BillingAddress: {
            Country: 'HU',
            City: formData.sameAsShipping ? formData.shippingCity : formData.billingCity,
            Zip: formData.sameAsShipping ? formData.shippingZipCode : formData.billingZipCode,
            Street: formData.sameAsShipping ? formData.shippingAddress : formData.billingAddress,
            FullName: formData.sameAsShipping ? formData.shippingFullName : formData.billingFullName,
          },
          RedirectUrl: `${window.location.origin}/payment/success`,
          CallbackUrl: `${window.location.origin}/api/payment/callback`,
          Currency: 'HUF',
          Transactions: [
            {
              POSTransactionId: `TRANS-${Date.now()}`,
              Payee: 'szilamer@gmail.com', // Barion fiók email címe
              Total: total,
              Comment: 'Rendelés fizetése',
              Items: items.map(item => ({
                Name: item.name,
                Description: item.description || '',
                Quantity: item.quantity,
                Unit: 'piece',
                UnitPrice: item.price,
                ItemTotal: item.price * item.quantity,
                SKU: item.id.toString(),
              })),
            },
          ],
        };

        if (!orderResponse.ok) {
          throw new Error('Hiba történt a rendelés létrehozása során');
        }

        const order = await orderResponse.json();

        // Barion fizetési oldalra irányítás
        const paymentUrl = await barionService.startPayment(paymentRequest);
        window.location.href = paymentUrl;
        return;
      }
      */

      // Calculate total with payment method fee
      const paymentFee = PAYMENT_METHODS[paymentMethod].fee || 0;
      const totalWithFees = total + paymentFee;

      // Create order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          shippingMethodId: selectedShippingMethod?.id,
          paymentMethod: PAYMENT_METHODS[paymentMethod].name,
          total: totalWithFees,
          
          // Szállítási cím
          shippingFullName: formData.shippingFullName,
          shippingCountry: formData.shippingCountry,
          shippingCity: formData.shippingCity,
          shippingAddress: formData.shippingAddress,
          shippingZipCode: formData.shippingZipCode,
          shippingPhone: formData.shippingPhone,
          shippingEmail: formData.shippingEmail,
          
          // Számlázási cím
          billingFullName: formData.sameAsShipping ? formData.shippingFullName : formData.billingFullName,
          billingCountry: formData.sameAsShipping ? formData.shippingCountry : formData.billingCountry,
          billingCity: formData.sameAsShipping ? formData.shippingCity : formData.billingCity,
          billingAddress: formData.sameAsShipping ? formData.shippingAddress : formData.billingAddress,
          billingZipCode: formData.sameAsShipping ? formData.shippingZipCode : formData.billingZipCode,
          billingPhone: formData.sameAsShipping ? formData.shippingPhone : formData.billingPhone,
          billingCompanyName: formData.isCompany ? formData.billingCompanyName : undefined,
          billingTaxNumber: formData.isCompany ? formData.billingTaxNumber : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Hiba történt a rendelés létrehozása során');
      }

      const order = await response.json();

      // Clear cart
      clearCart();

      // Show success message based on payment method
      if (paymentMethod === 'BANK_TRANSFER') {
        toast.success(`Rendelését rögzítettük! Rendelés azonosító: ${order.id}. Kérjük, az utalásnál a közlemény rovatban tüntesse fel ezt az azonosítót.`);
      } else {
        toast.success('Rendelését rögzítettük!');
      }

      // Redirect to thank you page
      router.push('/thank-you');
    } catch (error) {
      console.error('Order submission error:', error);
      toast.error('Hiba történt a rendelés feldolgozása során. Kérjük, próbálja újra!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Értékek figyelése
  const formValues = watch()

  // Billentyűzet események figyelése (Enter)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step === 'address') {
      e.preventDefault()
      handleSubmit(handleAddressSubmit)()
    }
  }

  return (
    <div className="container mx-auto px-4 py-8" onKeyDown={handleKeyPress}>
      <h1 className="mb-8 text-2xl font-bold">Megrendelés véglegesítése</h1>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="space-y-6">
            {/* Cím adatok űrlap */}
            {step === 'address' && (
              <div className="rounded-lg border border-border bg-background p-6 text-foreground">
                <h2 className="mb-4 text-lg font-semibold">Címadatok</h2>
                
                <form onSubmit={handleSubmit(handleAddressSubmit)} className="space-y-6">
                  {/* Szállítási cím */}
                  <div>
                    <h3 className="text-md font-semibold mb-3">Szállítási cím</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium mb-1">Teljes név*</label>
                        <input
                          type="text"
                          {...register('shippingFullName', { required: 'A név megadása kötelező' })}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                        {errors.shippingFullName && (
                          <p className="text-red-500 text-sm mt-1">{errors.shippingFullName.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Ország*</label>
                        <input
                          type="text"
                          {...register('shippingCountry', { required: 'Az ország megadása kötelező' })}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                        {errors.shippingCountry && (
                          <p className="text-red-500 text-sm mt-1">{errors.shippingCountry.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Irányítószám*</label>
                        <input
                          type="text"
                          {...register('shippingZipCode', { required: 'Az irányítószám megadása kötelező' })}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                        {errors.shippingZipCode && (
                          <p className="text-red-500 text-sm mt-1">{errors.shippingZipCode.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Város*</label>
                        <input
                          type="text"
                          {...register('shippingCity', { required: 'A város megadása kötelező' })}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                        {errors.shippingCity && (
                          <p className="text-red-500 text-sm mt-1">{errors.shippingCity.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Telefonszám</label>
                        <input
                          type="text"
                          {...register('shippingPhone')}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Email cím*</label>
                        <input
                          type="email"
                          {...register('shippingEmail', { 
                            required: 'Az email cím megadása kötelező',
                            pattern: {
                              value: /\S+@\S+\.\S+/,
                              message: 'Érvénytelen email cím formátum'
                            }
                          })}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                        {errors.shippingEmail && (
                          <p className="text-red-500 text-sm mt-1">{errors.shippingEmail.message}</p>
                        )}
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium mb-1">Cím*</label>
                        <input
                          type="text"
                          {...register('shippingAddress', { required: 'A cím megadása kötelező' })}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                        {errors.shippingAddress && (
                          <p className="text-red-500 text-sm mt-1">{errors.shippingAddress.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Számlázási cím */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-md font-semibold">Számlázási cím</h3>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          {...register('sameAsShipping')}
                          onChange={e => setSameAsShipping(e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm">Megegyezik a szállítási címmel</span>
                      </label>
                    </div>
                    
                    {!sameAsShipping && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium mb-1">Teljes név*</label>
                          <input
                            type="text"
                            {...register('billingFullName', { 
                              required: !sameAsShipping ? 'A név megadása kötelező' : false 
                            })}
                            className="w-full px-3 py-2 border rounded-md"
                          />
                          {errors.billingFullName && (
                            <p className="text-red-500 text-sm mt-1">{errors.billingFullName.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Ország*</label>
                          <input
                            type="text"
                            {...register('billingCountry', { 
                              required: !sameAsShipping ? 'Az ország megadása kötelező' : false 
                            })}
                            className="w-full px-3 py-2 border rounded-md"
                          />
                          {errors.billingCountry && (
                            <p className="text-red-500 text-sm mt-1">{errors.billingCountry.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Irányítószám*</label>
                          <input
                            type="text"
                            {...register('billingZipCode', { 
                              required: !sameAsShipping ? 'Az irányítószám megadása kötelező' : false 
                            })}
                            className="w-full px-3 py-2 border rounded-md"
                          />
                          {errors.billingZipCode && (
                            <p className="text-red-500 text-sm mt-1">{errors.billingZipCode.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Város*</label>
                          <input
                            type="text"
                            {...register('billingCity', { 
                              required: !sameAsShipping ? 'A város megadása kötelező' : false 
                            })}
                            className="w-full px-3 py-2 border rounded-md"
                          />
                          {errors.billingCity && (
                            <p className="text-red-500 text-sm mt-1">{errors.billingCity.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">Telefonszám</label>
                          <input
                            type="text"
                            {...register('billingPhone')}
                            className="w-full px-3 py-2 border rounded-md"
                          />
                        </div>
                        
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium mb-1">Cím*</label>
                          <input
                            type="text"
                            {...register('billingAddress', { 
                              required: !sameAsShipping ? 'A cím megadása kötelező' : false 
                            })}
                            className="w-full px-3 py-2 border rounded-md"
                          />
                          {errors.billingAddress && (
                            <p className="text-red-500 text-sm mt-1">{errors.billingAddress.message}</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Céges számlázás */}
                    <div className="mt-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          {...register('isCompany')}
                          onChange={e => setIsCompany(e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm">Cégként vásárolok</span>
                      </label>
                      
                      {isCompany && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                          <div>
                            <label className="block text-sm font-medium mb-1">Cégnév*</label>
                            <input
                              type="text"
                              {...register('billingCompanyName', { 
                                required: isCompany ? 'A cégnév megadása kötelező' : false 
                              })}
                              className="w-full px-3 py-2 border rounded-md"
                            />
                            {errors.billingCompanyName && (
                              <p className="text-red-500 text-sm mt-1">{errors.billingCompanyName.message}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">Adószám*</label>
                            <input
                              type="text"
                              {...register('billingTaxNumber', { 
                                required: isCompany ? 'Az adószám megadása kötelező' : false 
                              })}
                              className="w-full px-3 py-2 border rounded-md"
                            />
                            {errors.billingTaxNumber && (
                              <p className="text-red-500 text-sm mt-1">{errors.billingTaxNumber.message}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button 
                      type="submit" 
                      className="rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      Tovább a szállítási módokhoz
                    </button>
                  </div>
                </form>
              </div>
            )}
          
            {/* Szállítási módok */}
            {step === 'shipping' && (
              <div className="rounded-lg border border-border bg-background p-6 text-foreground">
                <h2 className="mb-4 text-lg font-semibold">Szállítási mód</h2>
                <div className="space-y-4">
                  {shippingMethods.map((method) => (
                    <label key={method.id} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="shipping"
                        value={method.id}
                        checked={selectedShippingMethod?.id === method.id}
                        onChange={() => setSelectedShippingMethod(method)}
                        className="h-4 w-4 border-border text-primary focus:ring-primary focus:ring-offset-2"
                      />
                      <span className="flex-1">{method.name}</span>
                      <span className="font-medium">{formatPrice(method.price)}</span>
                    </label>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => setStep('address')}
                    className="rounded-lg border border-primary px-8 py-3 font-medium text-primary transition-colors hover:bg-gray-100"
                  >
                    Vissza
                  </button>
                  <button
                    onClick={() => setStep('payment')}
                    className="rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Tovább a fizetési módokhoz
                  </button>
                </div>
              </div>
            )}

            {/* Fizetési módok */}
            {step === 'payment' && (
              <div className="rounded-lg border border-border bg-background p-6 text-foreground">
                <h2 className="mb-4 text-lg font-semibold">Fizetési mód</h2>
                <div className="space-y-4">
                  {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                    <label key={key} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="payment"
                        value={key}
                        checked={paymentMethod === key}
                        onChange={(e) => setPaymentMethod(e.target.value as keyof typeof PAYMENT_METHODS)}
                        className="h-4 w-4 border-border text-primary focus:ring-primary focus:ring-offset-2"
                      />
                      <span>{method.name}</span>
                    </label>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => setStep('shipping')}
                    className="rounded-lg border border-primary px-8 py-3 font-medium text-primary transition-colors hover:bg-gray-100"
                  >
                    Vissza
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="rounded-lg border border-border bg-background p-6 text-foreground">
            <h2 className="mb-4 text-lg font-semibold bg-white inline-block px-3 py-1 rounded text-black">Rendelés összegzése</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Részösszeg:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Szállítási költség:</span>
                <span>{formatPrice(shippingCost)}</span>
              </div>

              <div className="flex justify-between border-t pt-4 font-bold">
                <span className="bg-white px-3 py-1 rounded text-black">Végösszeg:</span>
                <span className="bg-white px-3 py-1 rounded text-black">{formatPrice(total)}</span>
              </div>

              {step === 'payment' && (
                <button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-primary px-8 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Feldolgozás...' : 'Megrendelés véglegesítése'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
