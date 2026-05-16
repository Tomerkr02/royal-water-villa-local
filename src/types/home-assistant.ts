export interface HomeAssistantState {
  entity_id: string;
  state: string;
  attributes?: {
    device_class?: string;
    entity_category?: string;
    friendly_name?: string;
    hvac_modes?: string[];
    percentage?: number;
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
  deviceClass?: string;
  entityCategory?: string;
  isControllable: boolean;
  isDiagnostic: boolean;
  isMapped: boolean;
}

export interface HomeAssistantServiceResponse {
  success?: boolean;
  result?: unknown;
  error?: string;
}
