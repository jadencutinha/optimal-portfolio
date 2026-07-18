import { loadStripe, type Stripe } from '@stripe/stripe-js'

let promise: Promise<Stripe | null> | null = null
let cachedKey = ''

export function getStripe(publishableKey: string): Promise<Stripe | null> {
  if (!promise || cachedKey !== publishableKey) {
    cachedKey = publishableKey
    promise = loadStripe(publishableKey)
  }
  return promise
}
