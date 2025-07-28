# Database Schema Documentation

This repository contains the SQL schema for the **XERON-q** project, located at `Server/SCHEMA/schema.sql`. The schema is designed for a MySQL 8.3.0 server and provides the data structure for the platform, including tables, indexes, triggers, and foreign key constraints.

---

## Database: `uv1`

### Key Features

- **User Management:**  
  Comprehensive `users` table with support for profiles, balances, rewards, referrals, and status flags.

- **Admin & Subadmin Roles:**  
  Separate `admins` and `subadmins` tables with role-based access and task assignments.

- **Rewards & Bonuses:**  
  - `bonus_history`, `bonus_history_level_up`, and `bonus_settings` for tracking user bonuses and level-up rewards.
  - `commission`, `salary_logs`, `salary_payments`, `monthly_salary_payments`, and `levels` for multi-level commission and salary structures.

- **Product & Offer Tracking:**  
  Tables for `products`, user clicks on products, and `offer` management.

- **Notifications & Messaging:**  
  - `notifications` and `messages` tables for system-user communications.

- **Withdrawal Management:**  
  - `withdrawals` and `withdrawal_requests` with detailed status tracking, triggers to ensure business rules (e.g., one pending request at a time).

- **Recruitment & Team Tracking:**  
  - `weekly_recruits`, `monthly_recruits`, and associated logic for MLM-style team and recruitment metrics.

- **Settings & Configuration:**  
  - Multiple tables for platform configuration like `bep20_settings`, `exchange_fee`, `initial_fee`, `usd_rate`, `withdraw_limit`, etc.

---

## Table Overview

| Table Name                | Purpose                                                      |
|---------------------------|-------------------------------------------------------------|
| admins                    | Admin user accounts                                         |
| subadmins                 | Subadmin accounts with task assignments                     |
| users                     | Main user profiles and status                               |
| users_accounts            | User account/bank details                                   |
| bonus_history             | Records of bonus distributions                              |
| bonus_settings            | Configurations for bonus system                             |
| commission                | Commission structure and values                             |
| salary_payments           | Weekly salary records                                       |
| monthly_salary_payments   | Monthly salary records                                      |
| levels                    | Level thresholds and salary amounts                         |
| weekly_recruits           | Weekly team recruitment stats                               |
| monthly_recruits          | Monthly team recruitment stats                              |
| notifications             | System-to-user notifications                                |
| messages                  | User messages                                               |
| withdrawals               | Withdrawal requests                                         |
| withdrawal_requests       | Detailed withdrawal requests (with triggers and status)      |
| offer                     | Special offers                                              |
| products                  | Product catalog                                             |
| user_product_clicks       | User clicks on products                                     |
| user_button_clicks        | User button click tracking                                  |
| push_subscriptions        | Web push notification endpoints                             |
| exchange_fee              | Exchange fee configuration                                  |
| initial_fee               | Initial platform fee configuration                          |
| joining_fee               | Joining fee configuration                                   |
| usd_rate                  | Current USD rate                                            |
| salary_logs               | Logs of salary collection attempts/results                  |
| bonus_button_clicks       | Admin bonus button activity                                 |
| monthly_levels            | Monthly level thresholds and salary                         |
| referrals                 | User referrals and approval status                          |
| notifications             | User notifications                                          |
| withdraw_limit            | Withdrawal limits per number of attempts                    |
| bep20_settings            | BEP20 wallet addresses and QR codes                         |

---

## Triggers

- **users**
  - `team_withdrawal_requests`: Syncs team count to withdrawal requests after user update.
  - `total_withdrawal_requests`: Syncs total withdrawn amount to withdrawal requests after user update.

- **withdrawal_requests**
  - `check_pending_request`: Prevents more than one pending withdrawal request per user.

---

## Constraints

- **Foreign Keys:**  
  Enforce referential integrity between users, recruits, salary payments, notifications, and withdrawal requests.

- **Unique Indexes:**  
  Enforce uniqueness on user emails, product clicks per day, button clicks per day, and other business logic.

---

## Usage

1. **Initialization:**  
   Run the entire `schema.sql` file on a MySQL 8+ server.
2. **Data Integrity:**  
   The schema uses triggers and foreign keys to enforce business rules for core operations (e.g., withdrawals, team updates).
3. **Extending:**  
   To add new features, create new tables or extend existing ones, following the conventions in this schema.

---

## License

See [LICENSE](../LICENSE) for details.

---

## Support

For questions or contributions, open an issue or pull request on this repository.
