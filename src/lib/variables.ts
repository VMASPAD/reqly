// Variable substitution engine for environments
import { Environment, KeyValue } from './types';

/**
 * Substitutes variables in a string using the provided environment variables
 * Supports syntax: {{variableName}}
 */
export function substituteVariables(
  text: string, 
  environment?: Environment,
  globalVariables: KeyValue[] = []
): string {
  if (!text) return text;

  let result = text;
  
  // Get all variables (environment + global)
  const allVariables = [
    ...(environment?.variables || []),
    ...globalVariables
  ];

  // Replace all {{variableName}} patterns
  result = result.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
    const variable = allVariables.find(
      v => v.key === variableName.trim() && v.enabled
    );
    
    if (variable) {
      return variable.value;
    }
    
    // If variable not found, leave as is or return empty string
    return match;
  });

  return result;
}

/**
 * Substitutes variables in request headers
 */
export function substituteInHeaders(
  headers: KeyValue[],
  environment?: Environment,
  globalVariables: KeyValue[] = []
): KeyValue[] {
  return headers.map(header => ({
    ...header,
    key: substituteVariables(header.key, environment, globalVariables),
    value: substituteVariables(header.value, environment, globalVariables)
  }));
}

/**
 * Substitutes variables in URL parameters
 */
export function substituteInParams(
  params: KeyValue[],
  environment?: Environment,
  globalVariables: KeyValue[] = []
): KeyValue[] {
  return params.map(param => ({
    ...param,
    key: substituteVariables(param.key, environment, globalVariables),
    value: substituteVariables(param.value, environment, globalVariables)
  }));
}

/**
 * Substitutes variables in request body (JSON string)
 */
export function substituteInBody(
  body: string,
  environment?: Environment,
  globalVariables: KeyValue[] = []
): string {
  return substituteVariables(body, environment, globalVariables);
}

/**
 * Gets all variable references in a text
 * Returns array of variable names found in {{}} syntax
 */
export function getVariableReferences(text: string): string[] {
  const matches = text.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];
  
  return matches.map(match => 
    match.replace(/^\{\{|\}\}$/g, '').trim()
  );
}

/**
 * Validates that all variables in text have corresponding values
 */
export function validateVariables(
  text: string,
  environment?: Environment,
  globalVariables: KeyValue[] = []
): { isValid: boolean; missingVariables: string[] } {
  const references = getVariableReferences(text);
  const allVariables = [
    ...(environment?.variables || []),
    ...globalVariables
  ];
  
  const missingVariables = references.filter(ref => {
    const variable = allVariables.find(
      v => v.key === ref && v.enabled
    );
    return !variable;
  });
  
  return {
    isValid: missingVariables.length === 0,
    missingVariables
  };
}
