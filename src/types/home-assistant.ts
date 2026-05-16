export interface HomeAssistantState {
  entity_id: string;
  state: string;
  attributes?: {
    friendly_name?: string;
    [key: string]: unknown;
  };
  last_changed?: string;
  last_updated?: string;
}

export interface HomeAssistantDebugEntity {
  entityId: string;
  friendlyName: string;
  domain: string;
  state: string;
}

export interface HomeAssistantServiceResponse {
  success?: boolean;
  result?: unknown;
  error?: string;
}
