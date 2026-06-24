---
name: Mock test accounts
description: Seeded users, tenants, permissions in src/lib/api/mock-backend.ts
type: feature
---
Tenants: default (Default), kiryana-rashid (Rashid Kiryana), mobile-zone (Mobile Zone).
Users (all password 1q2w3E*):
- admin → host (tenantId null), perms: AbpIdentity.Users, AbpTenantManagement.Tenants, FeatureManagement.ManageHostFeatures, Dashboard.View
- shopkeeper → tenant 'default', tenant-admin role, perms: Dashboard.View, POS.Create, Customers.Manage, Inventory.Manage, Reports.View
- cashier → tenant 'default', cashier role, perms: POS.Create only
Features per tenant: default has all (POS.Billing, Ledger.Udhaar, Inventory, Reports, WhatsApp); kiryana-rashid lacks Reports/WhatsApp; mobile-zone lacks Ledger/WhatsApp.
