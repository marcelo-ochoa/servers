import { CallToolRequest } from "@modelcontextprotocol/sdk/types.js";
import { withConnection } from "../db.js";

export const statsHandler = async (request: CallToolRequest) => {
    const tableName = request.params.arguments?.name as string;

    return await withConnection(async (client) => {
        const result = await client.query(`
      SELECT json_build_object(
        'table_stats', (
          SELECT json_build_object(
            'schema_name', n.nspname,
            'table_name', c.relname,
            'num_rows', c.reltuples,
            'blocks', c.relpages,
            'last_analyzed', s.last_analyze
          )
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
          WHERE c.relname = $1 AND n.nspname = 'public'
        ),
        'index_stats', (
          SELECT json_agg(
            json_build_object(
              'index_name', c2.relname,
              'num_rows', c2.reltuples,
              'blocks', c2.relpages,
              'index_size', pg_size_pretty(pg_relation_size(c2.oid))
            )
          )
          FROM pg_index i
          JOIN pg_class c ON c.oid = i.indrelid
          JOIN pg_class c2 ON c2.oid = i.indexrelid
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE c.relname = $1 AND n.nspname = 'public'
        ),
        'column_stats', (
          SELECT json_agg(
            json_build_object(
              'column_name', attname,
              'null_frac', null_frac,
              'avg_width', avg_width,
              'n_distinct', n_distinct
            )
          )
          FROM pg_stats
          WHERE tablename = $1 AND schemaname = 'public'
        )
      ) as stats_json
    `, [tableName]);

        return {
            content: [{ type: "text", text: JSON.stringify(result.rows[0].stats_json, null, 2), mimeType: "application/json" }],
            isError: false,
        };
    });
};
