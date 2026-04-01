-- ══════════════════════════════════════════
-- Migrations — خدماتي
-- تشغّل هذه الأوامر في Supabase SQL Editor
-- ══════════════════════════════════════════

-- ── البند 13: Indexes للحقول الأكثر بحثاً ──
CREATE INDEX IF NOT EXISTS idx_requests_status_city
  ON service_requests(status, city);

CREATE INDEX IF NOT EXISTS idx_requests_category
  ON service_requests(category);

CREATE INDEX IF NOT EXISTS idx_requests_client
  ON service_requests(client_id);

CREATE INDEX IF NOT EXISTS idx_quotes_request
  ON price_quotes(request_id, status);

CREATE INDEX IF NOT EXISTS idx_areas_contractor
  ON contractor_areas(contractor_id);

CREATE INDEX IF NOT EXISTS idx_notifs_user
  ON notifications(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_reviews_contractor
  ON reviews(contractor_id);

-- ── البند 14: badge_type constraint ──
ALTER TABLE contractor_profiles
  DROP CONSTRAINT IF EXISTS badge_type_check;

ALTER TABLE contractor_profiles
  ADD CONSTRAINT badge_type_check
  CHECK (badge_type IN ('none', 'verified', 'trusted'));

-- ── البند 12: Trigger لحساب avg_rating تلقائياً ──
CREATE OR REPLACE FUNCTION update_contractor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contractor_profiles
  SET
    avg_rating    = COALESCE((
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM reviews
      WHERE contractor_id = COALESCE(NEW.contractor_id, OLD.contractor_id)
    ), 0),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE contractor_id = COALESCE(NEW.contractor_id, OLD.contractor_id)
    )
  WHERE id = COALESCE(NEW.contractor_id, OLD.contractor_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_rating ON reviews;
CREATE TRIGGER trg_update_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_contractor_rating();

-- ── البند 16: Soft Delete على service_requests ──
ALTER TABLE service_requests
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_requests_deleted
  ON service_requests(deleted_at)
  WHERE deleted_at IS NULL;
