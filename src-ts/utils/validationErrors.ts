// TODO do this in Hyloa.

export type JsonSchema = symbol;

export type JsonValidationError<Schema extends JsonSchema> = jsonValidationErrors;

export abstract class jsonValidationErrors {}