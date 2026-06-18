const CLIENT_ID = '753d6b63-dc6b-4b28-83fc-6ead93660958';

export const endpoints = {
  login: () => `/api/v1/users/token/?client_id=${CLIENT_ID}`,
  customerRelationship: () => `/api/v1/customer-relationships/client/${CLIENT_ID}/`,
  profile: () => `/api/v1/users/profile/?client_id=${CLIENT_ID}`,
  bounties: () => `/api/v1/clients/${CLIENT_ID}/bounties/`,
  redeemCoupon: () => `/api/v1/clients/${CLIENT_ID}/redeem/`,
  redeemReward: () => `/api/v1/clients/${CLIENT_ID}/bounties/redeem/`,
};
