const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://127.0.0.1:54321'
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const REST_HEADERS = {
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'apikey': SERVICE_KEY,
}

async function restGet(path: string): Promise<any[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: REST_HEADERS })
  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`REST ${res.status}: ${err.slice(0, 200)}`)
  }
  return await res.json()
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    const { action, params = {} } = await req.json()

    switch (action) {
      case 'list_schemas': {
        // Query pg_namespace via information_schema.schemata
        const data = await restGet('information_schema.schemata?select=schema_name&order=schema_name')
        const schemas = data
          .filter((s: any) => !['pg_catalog','information_schema','pg_toast'].includes(s.schema_name))
          .map((s: any) => s.schema_name)
        // Get table counts per schema
        const result = []
        for (const schema of schemas) {
          const tables = await restGet(`information_schema.tables?table_schema=eq.${schema}&table_type=eq.BASE TABLE&select=table_name`)
          result.push({ schema_name: schema, table_count: tables.length })
        }
        return new Response(JSON.stringify({ success: true, schemas: result }), { headers: corsHeaders })
      }

      case 'list_tables': {
        const schema = params.schema || 'public'
        const tables = await restGet(`information_schema.tables?table_schema=eq.${schema}&table_type=eq.BASE TABLE&select=table_name,table_type&order=table_name`)
        // Get column counts
        const result = []
        for (const t of tables) {
          const cols = await restGet(`information_schema.columns?table_schema=eq.${schema}&table_name=eq.${t.table_name}&select=column_name&limit=500`)
          result.push({ table_schema: schema, table_name: t.table_name, table_type: t.table_type, column_count: cols.length })
        }
        return new Response(JSON.stringify({ success: true, schema, tables: result }), { headers: corsHeaders })
      }

      case 'describe_table': {
        const schema = params.schema || 'public'
        const table = params.table
        if (!table) throw new Error('table parameter is required')

        const columns = await restGet(`information_schema.columns?table_schema=eq.${schema}&table_name=eq.${table}&select=column_name,data_type,character_maximum_length,is_nullable,column_default,ordinal_position&order=ordinal_position`)

        const constraints = await restGet(`information_schema.table_constraints?table_schema=eq.${schema}&table_name=eq.${table}&select=constraint_name,constraint_type`)

        return new Response(JSON.stringify({
          success: true, schema, table,
          columns,
          constraints,
        }), { headers: corsHeaders })
      }

      case 'list_relationships': {
        const schema = params.schema || 'public'
        // Query information_schema for foreign key relationships
        const data = await restGet(`information_schema.table_constraints?table_schema=eq.${schema}&constraint_type=eq.FOREIGN KEY&select=constraint_name,table_name`)
        return new Response(JSON.stringify({ success: true, schema, relationships: data }), { headers: corsHeaders })
      }

      case 'search_schema': {
        const keyword = params.keyword
        if (!keyword) throw new Error('keyword parameter is required')
        const tables = await restGet(`information_schema.tables?table_name=ilike.%25${encodeURIComponent(keyword)}%25&select=table_schema,table_name,table_type&limit=50`)
        const columns = await restGet(`information_schema.columns?column_name=ilike.%25${encodeURIComponent(keyword)}%25&select=table_schema,table_name,column_name,data_type&limit=50`)
        return new Response(JSON.stringify({
          success: true, keyword,
          matches: {
            tables,
            columns,
          }
        }), { headers: corsHeaders })
      }

      default:
        throw new Error(`Unknown action: ${action}. Supported: list_schemas, list_tables, describe_table, list_relationships, search_schema`)
    }
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
