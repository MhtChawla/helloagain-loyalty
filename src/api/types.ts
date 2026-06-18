export interface LoginResponse {
  id: number;
  success: boolean;
  token: string;
  access_token: string;
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
}

export interface CustomerRelationship {
  id: number;
  points: number;
  appuser: AppUser;
}

export interface Bounty {
  id: string;
  name: string;
  description: string;
  is_redeemable: boolean;
  needed_points: number;
  cr_points: number;
}

export interface RedeemResponse {
  success: boolean;
  coupon: string;
  points: number;
  cr_points: number;
}

export interface RedeemRewardResponse {
  bounty_id: string;
}

export interface ApiError {
  status: number;
  message: string;
}
