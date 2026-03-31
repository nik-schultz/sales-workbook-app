const { createClient } = require('@supabase/supabase-js');

exports.handler = async function (event) {
  try {
    let branch_code = null;
    let created_by = 'manual';

    if (event.httpMethod === 'GET') {
      branch_code = event.queryStringParameters?.branch_code || null;
      created_by = event.queryStringParameters?.created_by || 'manual';
    } else if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      branch_code = body.branch_code || null;
      created_by = body.created_by || 'manual';
    } else {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ok: false, error: 'Method not allowed' })
      };
    }

    if (!branch_code) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ok: false, error: 'branch_code is required' })
      };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .select('id, code')
      .eq('code', branch_code)
      .single();

    if (branchError || !branch) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ok: false, error: 'Invalid branch_code' })
      };
    }

    const { data: run, error: runError } = await supabase
      .from('report_runs')
      .insert({
        branch_id: branch.id,
        created_by,
        status: 'pending'
      })
      .select()
      .single();

    if (runError) throw runError;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ok: true,
        message: 'Run created successfully',
        run
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ok: false,
        error: err.message
      })
    };
  }
};
