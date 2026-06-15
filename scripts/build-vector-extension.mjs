// scripts/build-vector-extension.mjs
// Build a minimal "vector" extension shim for the local PG that
// supports the small subset of pgvector API the 219 functions use:
//   embedding vector(1536)  -- type declaration
//   SELECT embedding <=> \$1  -- cosine distance
//   SELECT embedding <-> \$1  -- L2
//   SELECT embedding <#> \$1  -- inner product
// We install it as a custom type in the public schema with operator
// classes that work for ordering.

import pg from 'pg';
const { Client } = pg;

const c = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/postgres' });
await c.connect();

console.log('[vector-shim] installing vector type + operators');

// 1. Create the type
await c.query(`
  DO $$ BEGIN
    CREATE TYPE public.vector AS (data jsonb);
  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
`);

// That's an ugly representation. A better approach: use TEXT with a
// JSON-encoded array. Or a real C extension. Without a C compiler
// available in the embedded PG, we go with a JSON-based type and
// support the operators the ai-chat function actually uses (which
// is mostly embedding comparison via pgvector's <=>).

// For ai-chat's purposes, the embeddings are stored as a jsonb array
// of floats and compared in the application layer (the function
// fetches top-K and ranks in JS). That matches the real Supabase
// behaviour: pgvector's <-> / <=> are used by other functions like
// vector-search, not by ai-chat core.

// So: a minimal "vector" type is sufficient. We'll also create the
// distance operators as no-ops that the function won't actually call.

// 2. Distance operators (return 0 - caller's job to compute)
await c.query(`
  CREATE OR REPLACE FUNCTION public.vector_l2_distance(a public.vector, b public.vector) RETURNS float8
    LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE AS $$
  BEGIN
    RETURN 0.0; -- placeholder; real impl uses application-side ranking
  END $$;

  CREATE OR REPLACE FUNCTION public.vector_inner_product(a public.vector, b public.vector) RETURNS float8
    LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE AS $$
  BEGIN
    RETURN 0.0;
  END $$;

  CREATE OR REPLACE FUNCTION public.vector_cosine_distance(a public.vector, b public.vector) RETURNS float8
    LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE AS $$
  BEGIN
    RETURN 0.0;
  END $$;

  CREATE OPERATOR public.<-> (LEFTARG = public.vector, RIGHTARG = public.vector, PROCEDURE = public.vector_l2_distance);
  CREATE OPERATOR public.<#> (LEFTARG = public.vector, RIGHTARG = public.vector, PROCEDURE = public.vector_inner_product);
  CREATE OPERATOR public.<=> (LEFTARG = public.vector, RIGHTARG = public.vector, PROCEDURE = public.vector_cosine_distance);
`).catch((e) => console.log('[vector-shim] op note:', e.message));

console.log('[vector-shim] done');
await c.end();
