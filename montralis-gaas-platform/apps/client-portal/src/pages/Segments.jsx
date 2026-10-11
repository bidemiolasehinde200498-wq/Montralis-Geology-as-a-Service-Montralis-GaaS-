import React from 'react';
import SamplePanel from '../components/SamplePanel';

export const DroneDispatch = () => (
  <SamplePanel
    title="Drone & Field Validation Dispatch"
    description="Hire regional independent drone operators to validate AI targets."
    columns={['Job', 'Target', 'Operator', 'Status']}
    rows={[['DV-001', 'Lithium, Zimbabwe', 'Sample Operator A', 'Scheduled'], ['DV-002', 'Copper, Zambia', 'Sample Operator B', 'Open']]}
  />
);

export const Pipeline = () => (
  <SamplePanel
    title="Refined Logistical Pipeline"
    description="Shipments from mine sites to processing plants and port terminals."
    columns={['Shipment', 'Commodity', 'Route', 'Status']}
    rows={[['SH-100', 'Lithium concentrate', 'Mine → Beira Port', 'In transit'], ['SH-101', 'Copper cathode', 'Mine → Plant', 'Loading']]}
  />
);

export const CadastreRevenue = () => (
  <SamplePanel
    title="Sovereign Cadastre Revenue"
    description="Passive 1.5% micro-fee flows from national customs registries."
    columns={['Period', 'Registry', 'Fee rate', 'Amount']}
    rows={[['2026-Q3', 'Sample Registry', '1.5%', '£0.00'], ['2026-Q2', 'Sample Registry', '1.5%', '£0.00']]}
  />
);

export const BulkBillings = () => (
  <SamplePanel
    title="Bulk Commodity Billings"
    description="Corporate statements, payment history and escrow releases."
    columns={['Statement', 'Counterparty', 'Escrow', 'Amount']}
    rows={[['ST-001', 'Sample Buyer Ltd', 'Held', '£0.00'], ['ST-002', 'Sample Buyer Ltd', 'Released', '£0.00']]}
  />
);

export const SaasBillings = () => (
  <SamplePanel
    title="B2B Platform SaaS Billings"
    description="Seat licences and subscription packages for API map customers."
    columns={['Account', 'Plan', 'Seats', 'Status']}
    rows={[['Sample Explorer Co', 'Professional', '5', 'Active']]}
  />
);

export const ApiHub = () => (
  <SamplePanel
    title="API Developer Integration Hub"
    description="Manage API keys and data pipes to external systems."
    columns={['Key name', 'Scope', 'Created', 'Status']}
    rows={[['No keys issued', '-', '-', '-']]}
  />
);

export const BoundaryGuard = () => (
  <SamplePanel
    title="Sovereign Data Boundary Guard"
    description="Compliance logs for local resource laws and maritime legal codes."
    columns={['Jurisdiction', 'Rule', 'Last audit', 'Status']}
    rows={[['Zimbabwe', 'Mineral data localisation', '-', 'Pending'], ['Zambia', 'Resource nationalism review', '-', 'Pending']]}
  />
);
