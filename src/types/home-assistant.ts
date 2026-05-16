export interface HomeAssistantState {
  entity_id: string;
  state: string;
  attributes?: Record<string, unknown>;
  last_changed?: string;
  last_updated?: string;
}

export interface HomeAssistantServiceResponse {
  success?: boolean;
  result?: unknown;
  error?: string;
}
