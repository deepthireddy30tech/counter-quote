import type { CutoutKind, Room, Thickness } from './lib/quote';

/** Sizes in decimal inches. Edge and corner choices are per leg side (ADR 0003). */
export interface Leg {
  length: number;
  depth: number;
  turnAngle: number;
  backCovered: boolean;
  frontCovered: boolean;
  startCovered: boolean;
  endCovered: boolean;
  startFrontRadius: boolean;
  startBackRadius: boolean;
  endFrontRadius: boolean;
  endBackRadius: boolean;
  cutouts: { kind: CutoutKind; centerline: number; faucetHoles: number }[];
}

export interface Counter {
  room: Room;
  materialId: number;
  thickness: Thickness;
  edgeProfileId: number;
  backsplash: boolean;
  /** How the plan is drawn, clockwise in 90° steps (0, 90, 180, 270) and maybe mirrored. Never priced. */
  rotation: number;
  mirrored: boolean;
  legs: Leg[];
}

export interface QuoteLineItem {
  counter: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

/** Child rows have no ids here: saving a job replaces them all. */
export interface Job {
  id: number;
  customerName: string;
  tearOut: boolean;
  createdDate: string;
  counters: Counter[];
  additionalRequirements: { description: string; price: number }[];
  /** The saved quote; empty until the job is saved from the editor. */
  total: number | null;
  savedAt: string | null;
  validUntil: string | null;
  quoteDrawingSvg: string | null;
  lineItems: QuoteLineItem[];
}

export interface PriceList {
  priceGroups: { id: number; name: string; rates: { thickness: Thickness; pricePerSqFt: number }[] }[];
  materials: { id: number; name: string; priceGroupId: number }[];
  edgeProfiles: { id: number; name: string; pricePerLinearFt: number }[];
  fees: { id: number; kind: string; amount: number }[];
}

async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => null);
    const reasons = problem?.errors ? Object.values(problem.errors).flat().join(' ') : '';
    throw new Error(reasons || problem?.title || `Request failed (${response.status})`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const getJobs = () => request<Job[]>('/api/jobs');
export const getJob = (id: number) => request<Job>(`/api/jobs/${id}`);
export const createJob = (job: Job) => request<Job>('/api/jobs', 'POST', job);
export const updateJob = (job: Job) => request<Job>(`/api/jobs/${job.id}`, 'PUT', job);
export const deleteJob = (id: number) => request<void>(`/api/jobs/${id}`, 'DELETE');
export const getPriceList = () => request<PriceList>('/api/price-list');
export const savePriceList = (list: PriceList) => request<PriceList>('/api/price-list', 'PUT', list);
