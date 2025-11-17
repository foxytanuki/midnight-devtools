/**
 * Midnight Network Indexer GraphQL Schema Utilities
 * Schema introspection and validation
 */

import { GraphQLClient } from "../clients/graphql-client";

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
export function getTypeFields(schema: any, typeName: string): string[] {
	if (!schema?.__schema?.types) {
		return [];
	}

	const type = schema.__schema.types.find(
		(t: any) => t.name === typeName,
	);

	if (!type || !type.fields) {
		return [];
	}

	return type.fields.map((field: any) => field.name);
}

