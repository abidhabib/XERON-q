`
I’m building a level-based salary system in a Node.js + MySQL app. Here's what I have and what I need:

---

🧩 CURRENT STRUCTURE:

- Table: `levels`
  - `id`, `level` (1-15), `threshold` (team size required to reach level)

- Table: `users`
  - Fields: `id`, `refer_by`, `approved`, `team`, `level`, `backend_wallet`, `approved_at`

- When a user is approved:
  - Their referrer’s `team` and `level` update based on approved team count and threshold (already working).
  - Existing logic updates `level` dynamically.

---

🎯 GOAL: Weekly salary system based on user level

**Each level will have:**
- A specific weekly salary (`salary_amount`)
- A fixed weekday (`salary_day`) for salary collection (e.g., Level 1 = Sunday, Level 2 = Monday, etc.)

---

🛡️ SALARY COLLECTION RULES:

1. A user can only collect once per week.
2. Only allowed on the correct `salary_day` for their level.
3. Must prevent abuse: no double-clicks, retries, or race conditions.
4. Must work dynamically for all levels.

---

🛠️ WHAT I NEED:

1. **MySQL Migrations**
   - Extend `levels`: add `salary_amount` (INT), `salary_day` (ENUM of weekdays)
   - Extend `users`: add `last_salary_collected_at` (DATETIME)
   - (Optional) Create `salary_logs` to track collections

2. **API Endpoint**
   - `POST /collect-salary`
   - Auth required (JWT)
   - Inside a transaction:
     - Lock the user row
     - Check today is their `salary_day`
     - Check if `last_salary_collected_at` is same week
     - Credit `backend_wallet` with `salary_amount`
     - Update `last_salary_collected_at`
     - (Optional) Log in `salary_logs`
   - Error handling:
     - 403 if wrong day
     - 429 if already collected
     - 500 on failure

3. **Security**
   - Prevent multiple collections
   - Use `SELECT ... FOR UPDATE` with transaction
   - Sanitize all inputs

4. **Frontend UX (Brief)**
   - React example: salary button, disables after click, handles success/error

---

✅ DELIVERABLES:
- SQL migrations
- Express route handler with security
- React snippet (optional)
- Clean, production-level code with comments

`