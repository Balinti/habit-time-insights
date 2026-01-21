import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      console.log('Stripe not configured');
      return NextResponse.json({ received: true, error: 'Stripe not configured' });
    }

    const stripe = new Stripe(stripeSecretKey);

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    let event: Stripe.Event;

    // Verify signature if secret is present
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ received: true, error: 'Invalid signature' });
      }
    } else {
      // Parse without verification (development mode)
      event = JSON.parse(body) as Stripe.Event;
    }

    // Get app DB client
    const appUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const appKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!appUrl || !appKey) {
      console.log('App database not configured');
      return NextResponse.json({ received: true, error: 'App database not configured' });
    }

    const supabase = createClient(appUrl, appKey);

    // Handle events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Check if this is for our app
        if (session.metadata?.app_name !== 'habit-time-insights') {
          console.log('Checkout for different app, skipping');
          break;
        }

        const userId = session.metadata?.user_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId && customerId && subscriptionId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          // Determine plan from price
          const priceId = subscription.items.data[0]?.price.id;
          let plan = 'free';
          if (priceId === process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID) {
            plan = 'plus';
          } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
            plan = 'pro';
          }

          // Get current_period_end from the subscription object
          const periodEnd = (subscription as any).current_period_end;
          const currentPeriodEnd = periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : new Date().toISOString();

          // Upsert subscription record
          const { error } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan,
              status: subscription.status,
              current_period_end: currentPeriodEnd,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

          if (error) {
            console.error('Error updating subscription:', error);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        // Check if this is for our app
        if (subscription.metadata?.app_name !== 'habit-time-insights') {
          console.log('Subscription for different app, skipping');
          break;
        }

        const userId = subscription.metadata?.user_id;

        if (userId) {
          const priceId = subscription.items.data[0]?.price.id;
          let plan = 'free';
          if (priceId === process.env.NEXT_PUBLIC_STRIPE_PLUS_PRICE_ID) {
            plan = 'plus';
          } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
            plan = 'pro';
          }

          const periodEnd = (subscription as any).current_period_end;
          const currentPeriodEnd = periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : new Date().toISOString();

          const { error } = await supabase
            .from('subscriptions')
            .update({
              plan,
              status: subscription.status,
              current_period_end: currentPeriodEnd,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

          if (error) {
            console.error('Error updating subscription:', error);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Check if this is for our app
        if (subscription.metadata?.app_name !== 'habit-time-insights') {
          console.log('Subscription for different app, skipping');
          break;
        }

        const userId = subscription.metadata?.user_id;

        if (userId) {
          const { error } = await supabase
            .from('subscriptions')
            .update({
              plan: 'free',
              status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);

          if (error) {
            console.error('Error updating subscription:', error);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ received: true, error: error.message });
  }
}
