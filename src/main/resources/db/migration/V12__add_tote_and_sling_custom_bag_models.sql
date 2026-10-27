-- Extend the allowed types without changing existing requests or applied migrations.
ALTER TABLE custom_bag_requests
    DROP CONSTRAINT custom_bag_requests_bag_type_check;

ALTER TABLE custom_bag_requests
    ADD CONSTRAINT custom_bag_requests_bag_type_check
    CHECK (bag_type IN ('BACKPACK', 'LAPTOP_BAG', 'DUFFEL_BAG', 'TOTE_BAG', 'SLING_BAG'));
