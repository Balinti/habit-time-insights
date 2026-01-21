import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const AUTH_SUPABASE_URL = 'https://api.srv936332.hstgr.cloud';
const AUTH_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

export async function POST(request: NextRequest) {
  try {
    // Get user from shared auth
    const authClient = createClient(AUTH_SUPABASE_URL, AUTH_SUPABASE_ANON_KEY);
    const { data: { user } } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get app DB client
    const appUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const appKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!appUrl || !appKey) {
      return NextResponse.json(
        { error: 'App database not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(appUrl, appKey);
    const body = await request.json();
    const { experiments, dailyCheckins, dailyMetrics } = body;

    // Check if user already has data
    const { data: existingExperiments } = await supabase
      .from('experiments')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    const hasExistingData = existingExperiments && existingExperiments.length > 0;

    // Migrate experiments
    if (experiments && experiments.length > 0) {
      for (const exp of experiments) {
        // Check if experiment already exists (by id)
        const { data: existing } = await supabase
          .from('experiments')
          .select('id')
          .eq('id', exp.id)
          .single();

        if (!existing) {
          const { error } = await supabase
            .from('experiments')
            .insert({
              id: exp.id,
              user_id: user.id,
              playbook_id: exp.playbookId,
              status: exp.status,
              start_date: exp.startDate,
              end_date: exp.endDate,
              preregistration: exp.preregistration,
              decision: exp.decision,
              analysis: exp.analysis,
              created_at: exp.createdAt,
            });

          if (error) {
            console.error('Error inserting experiment:', error);
          }
        }
      }
    }

    // Migrate daily checkins
    if (dailyCheckins && dailyCheckins.length > 0) {
      for (const checkin of dailyCheckins) {
        // Upsert by unique constraint (user_id, experiment_id, date)
        const { error } = await supabase
          .from('daily_checkins')
          .upsert({
            id: checkin.id,
            experiment_id: checkin.experimentId,
            user_id: user.id,
            date: checkin.date,
            adherence: checkin.adherence,
            energy: checkin.energy,
            note: checkin.note,
            created_at: checkin.createdAt,
          }, { onConflict: 'user_id,experiment_id,date' });

        if (error) {
          console.error('Error inserting checkin:', error);
        }
      }
    }

    // Migrate daily metrics
    if (dailyMetrics && dailyMetrics.length > 0) {
      for (const metric of dailyMetrics) {
        // Upsert by unique constraint (user_id, date)
        const { error } = await supabase
          .from('daily_metrics')
          .upsert({
            id: metric.id,
            user_id: user.id,
            date: metric.date,
            focus_blocks: metric.focusBlocks,
            source: metric.source,
            created_at: metric.createdAt,
          }, { onConflict: 'user_id,date' });

        if (error) {
          console.error('Error inserting metric:', error);
        }
      }
    }

    // Create profile if not exists
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        created_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (profileError) {
      console.error('Error creating profile:', profileError);
    }

    return NextResponse.json({
      success: true,
      merged: hasExistingData,
      message: hasExistingData
        ? 'Data merged with existing cloud data'
        : 'Data migrated to cloud',
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    );
  }
}
