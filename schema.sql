-- schema.sql
CREATE TABLE IF NOT EXISTS payment_methods (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'debit_card', 'credit_card', 'upi', 'net_banking'
    identifier TEXT NOT NULL, -- e.g., 'HDFC 1234'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'INR',
    billing_cycle TEXT NOT NULL, -- e.g., '1 month', '1 year'
    last_renewal_date DATE,
    next_renewal_date DATE,
    payment_method_id TEXT,
    status TEXT DEFAULT 'active', -- 'trial', 'active', 'renewing_soon', 'charged', 'failed', 'cancelled'
    source TEXT DEFAULT 'manual', -- 'manual', 'auto'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id)
);

CREATE TABLE IF NOT EXISTS renewal_events (
    id TEXT PRIMARY KEY,
    subscription_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'pre_debit_alert', 'charge_confirmed', 'charge_failed', 'amount_changed'
    amount REAL NOT NULL,
    event_date DATETIME NOT NULL,
    payment_method_used TEXT,
    raw_source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
);
