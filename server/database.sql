ALTER TABLE users
  ADD COLUMN access_profile ENUM('default','readonly','custom') NOT NULL DEFAULT 'default',
  ADD COLUMN permissions_json JSON NULL COMMENT 'רשימת הרשאות אפקטיבית כאשר profile=custom';

ALTER TABLE users
  ADD INDEX idx_users_role (role),
  ADD INDEX idx_users_access_profile (access_profile);

CREATE TABLE permissions_catalog (
  perm_key VARCHAR(64) PRIMARY KEY,
  is_readonly_safe TINYINT(1) NOT NULL DEFAULT 0,
  description VARCHAR(255) NULL
);

INSERT INTO permissions_catalog (perm_key, is_readonly_safe, description) VALUES
  ('users.view',        1, 'צפייה במשתמשים'),
  ('users.edit',        0, 'עריכת משתמשים'),
  ('subs.view',         1, 'צפייה במנויים'),
  ('subs.edit',         0, 'עריכת מנויים'),
  ('payments.view',     1, 'צפייה בתשלומים'),
  ('payments.refund',   0, 'ביצוע החזר תשלום'),
  ('analytics.view',    1, 'דוחות וניתוחים'),
  ('staff.manage',      0, 'ניהול צוות והרשאות'),
  ('notifications.manage', 0, 'ניהול התראות'),
  ('classes.manage',    0, 'ניהול שיעורים'),
  ('plans.manage',      0, 'ניהול תוכניות אימון');

CREATE TABLE role_presets (
  role ENUM('trainee','trainer','admin') NOT NULL,
  perm_key VARCHAR(64) NOT NULL,
  PRIMARY KEY (role, perm_key),
  CONSTRAINT fk_preset_perm FOREIGN KEY (perm_key)
    REFERENCES permissions_catalog(perm_key) ON DELETE CASCADE
);

INSERT INTO role_presets (role, perm_key)
  SELECT 'admin', perm_key FROM permissions_catalog;

INSERT INTO role_presets (role, perm_key) VALUES
  ('trainer','users.view'),
  ('trainer','subs.view'),
  ('trainer','analytics.view'),
  ('trainer','classes.manage'),
  ('trainer','plans.manage');

