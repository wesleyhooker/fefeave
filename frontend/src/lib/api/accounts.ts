import { backendGetJson, backendMutateJson } from './backend';

export type AccountType = 'OWNER' | 'WHOLESALER';
export type AccountStatus = 'ACTIVE' | 'ARCHIVED';

export interface AccountDTO {
  id: string;
  displayName: string;
  type: AccountType;
  linkedUserId?: string;
  linkedUserEmail?: string;
  status: AccountStatus;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  wholesalerId?: string;
  owedTotal?: string;
  paidTotal?: string;
  balanceOwed?: string;
  lastPaymentDate?: string;
  selfPayTotal?: string;
  lastSelfPayAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListAccountsParams {
  type?: AccountType;
  status?: AccountStatus;
  search?: string;
}

export interface CreateAccountDTO {
  displayName: string;
  type?: AccountType;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}

export interface UpdateAccountDTO {
  displayName?: string;
  status?: AccountStatus;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}

function toQuery(params?: ListAccountsParams): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  if (params.type) sp.set('type', params.type);
  if (params.status) sp.set('status', params.status);
  if (params.search?.trim()) sp.set('search', params.search.trim());
  const q = sp.toString();
  return q ? `?${q}` : '';
}

export async function listAccounts(
  params?: ListAccountsParams,
): Promise<AccountDTO[]> {
  return backendGetJson<AccountDTO[]>(`/accounts${toQuery(params)}`);
}

export async function createAccount(
  payload: CreateAccountDTO,
): Promise<AccountDTO> {
  const created = await backendMutateJson<AccountDTO>('/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!created) throw new Error('Expected account body');
  return created;
}

export async function updateAccount(
  accountId: string,
  payload: UpdateAccountDTO,
): Promise<AccountDTO> {
  const updated = await backendMutateJson<AccountDTO>(
    `/accounts/${encodeURIComponent(accountId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
  if (!updated) throw new Error('Expected account body');
  return updated;
}

export async function linkAccountUser(
  accountId: string,
  userId: string,
): Promise<void> {
  await backendMutateJson(
    `/accounts/${encodeURIComponent(accountId)}/link-user`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    },
  );
}

export async function unlinkAccountUser(accountId: string): Promise<void> {
  await backendMutateJson(
    `/accounts/${encodeURIComponent(accountId)}/unlink-user`,
    {
      method: 'POST',
    },
  );
}
