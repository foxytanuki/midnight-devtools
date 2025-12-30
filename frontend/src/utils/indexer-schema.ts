/**
 * Midnight Network Indexer GraphQL Schema Utilities
 * Schema introspection and validation
 */

import type { GraphQLClient } from "../clients/graphql-client";

/**
 * Introspect the GraphQL schema to understand available fields
 */
export async function introspectSchema(
	client: GraphQLClient,
): Promise<unknown> {
	const introspectionQuery = `
    query IntrospectionQuery {
      __schema {
        queryType {
          name
          fields {
            name
            description
            args {
              name
              description
              type {
                name
                kind
                ofType {
                  name
                  kind
                  ofType {
                    name
                    kind
                  }
                }
              }
            }
            type {
              name
              kind
              ofType {
                name
                kind
                fields {
                  name
                  description
                  type {
                    name
                    kind
                  }
                }
              }
            }
          }
        }
        types {
          name
          kind
          description
          fields {
            name
            description
            type {
              name
              kind
              ofType {
                name
                kind
              }
            }
          }
        }
      }
    }
  `;

	try {
		const result = await client.query(introspectionQuery);
		return result;
	} catch (error) {
		console.error("Failed to introspect schema:", error);
		throw error;
	}
}

/**
 * Get available fields for a type
 */
// biome-ignore lint/suspicious/noExplicitAny: GraphQL schema introspection types are complex and dynamic
export function getTypeFields(schema: any, typeName: string): string[] {
	if (!schema?.__schema?.types) {
		return [];
	}

	// biome-ignore lint/suspicious/noExplicitAny: GraphQL schema introspection types are complex and dynamic
	const type = schema.__schema.types.find((t: any) => t.name === typeName);

	if (!type || !type.fields) {
		return [];
	}

	// biome-ignore lint/suspicious/noExplicitAny: GraphQL schema introspection types are complex and dynamic
	return type.fields.map((field: any) => field.name);
}
