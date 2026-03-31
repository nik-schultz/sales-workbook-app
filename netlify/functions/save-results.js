const { createClient } = require('@supabase/supabase-js');

exports.handler = async function (event) {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ ok: false, error: 'Method not allowed' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { run_id, summary, rows } = body;

    if (!run_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: 'run_id is required' })
      };
    }

    if (!Array.isArray(rows)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: 'rows must be an array' })
      };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error: deleteError } = await supabase
      .from('report_results_web')
      .delete()
      .eq('report_run_id', run_id);

    if (deleteError) throw deleteError;

    const payload = rows.map(row => ({
      report_run_id: run_id,
      client_name: row.client_name || '',
      city: row.city || '',
      state: row.state || '',
      units: row.units || 0,
      last_marketed_date: row.last_marketed_date || '',
      days_since_last_touch: row.days_since_last_touch,
      status: row.status || '',
      boomerang: row.boomerang || 'No',
      boom_sales_rep: row.boom_sales_rep || '',
      boom_2025_rev: row.boom_2025_rev || 0,
      boom_2026_rev: row.boom_2026_rev || 0
    }));

    if (payload.length) {
      const { error: insertError } = await supabase
        .from('report_results_web')
        .insert(payload);

      if (insertError) throw insertError;
    }

    const { error: updateError } = await supabase
      .from('report_runs')
      .update({
        total_clients: summary?.total_clients || 0,
        fresh_count: summary?.fresh_count || 0,
        stale_count: summary?.stale_count || 0,
        no_activity_count: summary?.no_activity_count || 0,
        boomerang_match_count: summary?.boomerang_match_count || 0,
        status: 'completed'
      })
      .eq('id', run_id);

    if (updateError) throw updateError;

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        saved_rows: payload.length
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: err.message
      })
    };
  }
};
