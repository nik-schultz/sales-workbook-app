const { createClient } = require('@supabase/supabase-js');

exports.handler = async function () {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('branches')
      .select('id, code, name, is_active')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        message: 'Connected to Supabase successfully',
        branches: data
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
