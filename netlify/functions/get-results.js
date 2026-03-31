const { createClient } = require('@supabase/supabase-js');

exports.handler = async function (event) {
  try {
    const run_id = event.queryStringParameters?.run_id;

    if (!run_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: 'run_id is required' })
      };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: run, error: runError } = await supabase
      .from('report_runs')
      .select('id, total_clients, fresh_count, stale_count, no_activity_count, boomerang_match_count, created_at')
      .eq('id', run_id)
      .single();

    if (runError) throw runError;

    const { data: rows, error: rowsError } = await supabase
      .from('report_results_web')
      .select('*')
      .eq('report_run_id', run_id)
      .order('client_name', { ascending: true });

    if (rowsError) throw rowsError;

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        summary: {
          total_clients: run.total_clients,
          fresh_count: run.fresh_count,
          stale_count: run.stale_count,
          no_activity_count: run.no_activity_count,
          boomerang_match_count: run.boomerang_match_count,
          created_at: run.created_at
        },
        rows: rows || []
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
