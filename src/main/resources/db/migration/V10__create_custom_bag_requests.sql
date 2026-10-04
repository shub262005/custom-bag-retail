CREATE TABLE custom_bag_request_sequences (
    year INTEGER PRIMARY KEY,
    last_value BIGINT NOT NULL CHECK (last_value >= 0)
);

CREATE TABLE custom_bag_requests (
    custom_bag_request_id BIGSERIAL PRIMARY KEY,
    request_number VARCHAR(30) NOT NULL UNIQUE,
    customer_user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    request_type VARCHAR(30) NOT NULL CHECK (request_type IN ('STANDARD', 'SPECIAL_DESIGN')),
    bag_type VARCHAR(30) NOT NULL CHECK (bag_type IN ('BACKPACK', 'LAPTOP_BAG', 'DUFFEL_BAG')),
    size VARCHAR(20) NOT NULL CHECK (size IN ('SMALL', 'MEDIUM', 'LARGE')),
    material VARCHAR(30) NOT NULL CHECK (material IN ('POLYESTER', 'CANVAS', 'LEATHER')),
    body_color VARCHAR(20) NOT NULL,
    pocket_color VARCHAR(20) NOT NULL,
    strap_color VARCHAR(20) NOT NULL,
    front_pocket BOOLEAN NOT NULL,
    side_pockets BOOLEAN NOT NULL,
    compartment_count INTEGER NOT NULL CHECK (compartment_count BETWEEN 1 AND 4),
    laptop_padding BOOLEAN NOT NULL,
    water_resistant BOOLEAN NOT NULL,
    logo_reference VARCHAR(500),
    logo_position VARCHAR(30),
    custom_text VARCHAR(24),
    text_color VARCHAR(20),
    text_position VARCHAR(30),
    customer_notes VARCHAR(1000),
    estimated_price NUMERIC(12,2) NOT NULL CHECK (estimated_price >= 0),
    status VARCHAR(30) NOT NULL CHECK (status IN ('SUBMITTED','REVIEWING','APPROVED','REJECTED','COMPLETED','CANCELLED')),
    admin_note VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_custom_bag_requests_customer ON custom_bag_requests(customer_user_id);
CREATE INDEX idx_custom_bag_requests_status_created ON custom_bag_requests(status, created_at DESC);
