const { createClient } = require('@supabase/supabase-js');

exports.handler = async function (event) {
  try {
    const body = JSON.parse(event.body || '{}');

    const { branch_code, created_by } = body;

    if (!branch_code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'branch_code is required' })
      };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // get branch id
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .select('id, code')
      .eq('code', branch_code)
      .single();

    if (branchError || !branch) {
      throw new Error('Invalid branch');
    }

    // create run
    const { data: run, error: runError } = await supabase
      .from('report_runs')
      .insert({
        branch_id: branch.id,
        created_by: created_by || 'manual',
        status: 'pending'
      })
      .select()
      .single();

    if (runError) throw runError;

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        run
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
