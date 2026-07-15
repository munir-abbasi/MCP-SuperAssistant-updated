import { CfWorkerJsonSchemaValidator, type CfWorkerSchemaDraft } from '@modelcontextprotocol/sdk/validation/cfworker';
import type { JsonSchemaType, JsonSchemaValidator, jsonSchemaValidator } from '@modelcontextprotocol/sdk/validation';

const schemaDraftFromUri = (schema: JsonSchemaType): CfWorkerSchemaDraft => {
  const schemaUri = typeof schema.$schema === 'string' ? schema.$schema : '';

  if (schemaUri.includes('draft-04')) return '4';
  if (schemaUri.includes('draft-07')) return '7';
  if (schemaUri.includes('2019-09')) return '2019-09';
  return '2020-12';
};

/**
 * JSON Schema validation for extension contexts where MV3 CSP forbids the
 * runtime code generation used by AJV. Invalid schemas are converted into a
 * validator that fails that tool call, rather than failing the entire tool list.
 */
export class BrowserJsonSchemaValidator implements jsonSchemaValidator {
  getValidator<T>(schema: JsonSchemaType): JsonSchemaValidator<T> {
    try {
      return new CfWorkerJsonSchemaValidator({
        draft: schemaDraftFromUri(schema),
        shortcircuit: false,
      }).getValidator<T>(schema);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      return () => ({
        valid: false as const,
        data: undefined,
        errorMessage: `Unsupported tool output schema: ${errorMessage}`,
      });
    }
  }
}

export { schemaDraftFromUri };
