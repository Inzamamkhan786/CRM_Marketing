-- ============================================================
-- Xeno AI-Native Marketing CRM — Database Schema
-- ============================================================

-- Drop tables if re-running (order matters due to FKs)
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS communications CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS segments CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- ------------------------------------------------------------
-- customers
-- ------------------------------------------------------------
CREATE TABLE customers (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100)  NOT NULL,
    email      VARCHAR(255)  UNIQUE NOT NULL,
    phone      VARCHAR(20),
    city       VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- orders
-- ------------------------------------------------------------
CREATE TABLE orders (
    id          SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    amount      DECIMAL(10, 2) NOT NULL,
    order_date  TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- segments
-- ------------------------------------------------------------
CREATE TABLE segments (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    rules         JSONB        NOT NULL DEFAULT '{}',
    audience_size INTEGER      DEFAULT 0,
    created_at    TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- campaigns
-- ------------------------------------------------------------
CREATE TABLE campaigns (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    segment_id INTEGER REFERENCES segments(id) ON DELETE SET NULL,
    channel    VARCHAR(50)  NOT NULL DEFAULT 'Email',
    message    TEXT         NOT NULL,
    status     VARCHAR(50)  NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- communications  (one row per customer per campaign)
-- ------------------------------------------------------------
CREATE TABLE communications (
    id          SERIAL PRIMARY KEY,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    status      VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    sent_at     TIMESTAMP DEFAULT NOW()
);

-- ------------------------------------------------------------
-- receipts  (delivery events from channel service callbacks)
-- ------------------------------------------------------------
CREATE TABLE receipts (
    id               SERIAL PRIMARY KEY,
    communication_id INTEGER REFERENCES communications(id) ON DELETE CASCADE,
    event_type       VARCHAR(50) NOT NULL,
    event_time       TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- SEED DATA — 50 realistic customers + orders
-- ============================================================

INSERT INTO customers (name, email, phone, city) VALUES
('Aarav Sharma',      'aarav.sharma@gmail.com',      '9876543210', 'Mumbai'),
('Priya Patel',       'priya.patel@gmail.com',        '9867453201', 'Ahmedabad'),
('Rohan Mehta',       'rohan.mehta@gmail.com',        '9845123467', 'Bangalore'),
('Sneha Iyer',        'sneha.iyer@yahoo.com',          '9823456781', 'Chennai'),
('Vikram Singh',      'vikram.singh@outlook.com',     '9812345678', 'Delhi'),
('Ananya Nair',       'ananya.nair@gmail.com',         '9801234567', 'Kochi'),
('Karan Kapoor',      'karan.kapoor@gmail.com',        '9798765432', 'Mumbai'),
('Meera Reddy',       'meera.reddy@gmail.com',         '9787654321', 'Hyderabad'),
('Arjun Joshi',       'arjun.joshi@yahoo.com',         '9776543210', 'Pune'),
('Divya Gupta',       'divya.gupta@gmail.com',         '9765432109', 'Delhi'),
('Siddharth Rao',     'siddharth.rao@gmail.com',       '9754321098', 'Bangalore'),
('Pooja Verma',       'pooja.verma@gmail.com',         '9743210987', 'Jaipur'),
('Amit Khanna',       'amit.khanna@outlook.com',       '9732109876', 'Chandigarh'),
('Nisha Bose',        'nisha.bose@gmail.com',           '9721098765', 'Kolkata'),
('Rajesh Pillai',     'rajesh.pillai@gmail.com',       '9710987654', 'Kochi'),
('Kavya Menon',       'kavya.menon@yahoo.com',          '9709876543', 'Trivandrum'),
('Harsh Agarwal',     'harsh.agarwal@gmail.com',       '9698765432', 'Lucknow'),
('Deepika Shah',      'deepika.shah@gmail.com',         '9687654321', 'Surat'),
('Nikhil Kumar',      'nikhil.kumar@gmail.com',         '9676543210', 'Patna'),
('Shruti Mishra',     'shruti.mishra@outlook.com',     '9665432109', 'Bhopal'),
('Varun Tiwari',      'varun.tiwari@gmail.com',         '9654321098', 'Indore'),
('Pallavi Das',       'pallavi.das@gmail.com',           '9643210987', 'Guwahati'),
('Raghav Chandra',   'raghav.chandra@gmail.com',      '9632109876', 'Hyderabad'),
('Ishaan Malhotra',  'ishaan.malhotra@gmail.com',     '9621098765', 'Gurugram'),
('Aditi Srivastava', 'aditi.srivastava@yahoo.com',    '9610987654', 'Varanasi'),
('Tushar Pandey',    'tushar.pandey@gmail.com',        '9609876543', 'Kanpur'),
('Riya Saxena',      'riya.saxena@gmail.com',           '9598765432', 'Agra'),
('Mohit Bhatt',      'mohit.bhatt@outlook.com',        '9587654321', 'Dehradun'),
('Sakshi Garg',      'sakshi.garg@gmail.com',           '9576543210', 'Noida'),
('Dhruv Chopra',     'dhruv.chopra@gmail.com',          '9565432109', 'Amritsar'),
('Mansi Dixit',      'mansi.dixit@gmail.com',            '9554321098', 'Nagpur'),
('Aakash Dubey',     'aakash.dubey@gmail.com',          '9543210987', 'Raipur'),
('Simran Kaur',      'simran.kaur@yahoo.com',            '9532109876', 'Ludhiana'),
('Yash Mathur',      'yash.mathur@gmail.com',            '9521098765', 'Faridabad'),
('Kritika Bansal',   'kritika.bansal@gmail.com',        '9510987654', 'Meerut'),
('Vivek Shukla',     'vivek.shukla@gmail.com',           '9509876543', 'Allahabad'),
('Tanvi Jain',       'tanvi.jain@outlook.com',           '9498765432', 'Jodhpur'),
('Rahul Negi',       'rahul.negi@gmail.com',             '9487654321', 'Haridwar'),
('Anjali Thakur',    'anjali.thakur@gmail.com',         '9476543210', 'Shimla'),
('Piyush Rawat',     'piyush.rawat@gmail.com',           '9465432109', 'Dehradun'),
('Neha Bajaj',       'neha.bajaj@gmail.com',             '9454321098', 'Pune'),
('Sachin Yadav',     'sachin.yadav@yahoo.com',           '9443210987', 'Bhubaneswar'),
('Preeti Ojha',      'preeti.ojha@gmail.com',             '9432109876', 'Ranchi'),
('Shubham Ghosh',   'shubham.ghosh@gmail.com',          '9421098765', 'Kolkata'),
('Aparna Roy',       'aparna.roy@gmail.com',              '9410987654', 'Siliguri'),
('Rohit Soni',       'rohit.soni@outlook.com',           '9409876543', 'Udaipur'),
('Lakshmi Krishnan', 'lakshmi.krishnan@gmail.com',     '9398765432', 'Coimbatore'),
('Gaurav Pandya',   'gaurav.pandya@gmail.com',          '9387654321', 'Vadodara'),
('Swati Kulkarni',  'swati.kulkarni@gmail.com',        '9376543210', 'Nashik'),
('Abhishek Rane',   'abhishek.rane@gmail.com',          '9365432109', 'Goa');

-- Seed orders (varied amounts and dates to enable interesting segments)
INSERT INTO orders (customer_id, amount, order_date) VALUES
-- High spenders, recent
(1,  8500.00, NOW() - INTERVAL '5 days'),
(1,  3200.00, NOW() - INTERVAL '2 days'),
(2,  6700.00, NOW() - INTERVAL '10 days'),
(3,  9200.00, NOW() - INTERVAL '3 days'),
(4,  4500.00, NOW() - INTERVAL '7 days'),
(5,  7800.00, NOW() - INTERVAL '1 day'),
(6,  5600.00, NOW() - INTERVAL '15 days'),
(7, 12000.00, NOW() - INTERVAL '4 days'),
(8,  3400.00, NOW() - INTERVAL '20 days'),
(9,  6100.00, NOW() - INTERVAL '8 days'),
-- Medium spenders, semi-recent
(10, 2800.00, NOW() - INTERVAL '25 days'),
(11, 4100.00, NOW() - INTERVAL '18 days'),
(12, 1900.00, NOW() - INTERVAL '35 days'),
(13, 5300.00, NOW() - INTERVAL '22 days'),
(14, 3700.00, NOW() - INTERVAL '40 days'),
(15, 2200.00, NOW() - INTERVAL '28 days'),
(16, 6800.00, NOW() - INTERVAL '12 days'),
(17, 4400.00, NOW() - INTERVAL '16 days'),
(18, 1600.00, NOW() - INTERVAL '50 days'),
(19, 3000.00, NOW() - INTERVAL '45 days'),
-- Inactive high spenders (good for "win-back" campaigns)
(20, 7500.00, NOW() - INTERVAL '75 days'),
(21, 8900.00, NOW() - INTERVAL '65 days'),
(22, 6200.00, NOW() - INTERVAL '80 days'),
(23, 5100.00, NOW() - INTERVAL '70 days'),
(24, 9800.00, NOW() - INTERVAL '90 days'),
(25, 4300.00, NOW() - INTERVAL '62 days'),
(26, 7100.00, NOW() - INTERVAL '68 days'),
(27, 5800.00, NOW() - INTERVAL '85 days'),
-- Low spenders
(28,  800.00, NOW() - INTERVAL '10 days'),
(29, 1200.00, NOW() - INTERVAL '6 days'),
(30,  950.00, NOW() - INTERVAL '30 days'),
(31, 1450.00, NOW() - INTERVAL '55 days'),
(32,  600.00, NOW() - INTERVAL '14 days'),
(33, 1100.00, NOW() - INTERVAL '9 days'),
(34,  750.00, NOW() - INTERVAL '42 days'),
(35, 1350.00, NOW() - INTERVAL '19 days'),
-- Additional orders for some customers (multi-order)
(1,  2100.00, NOW() - INTERVAL '60 days'),
(3,  1800.00, NOW() - INTERVAL '45 days'),
(7,  4300.00, NOW() - INTERVAL '30 days'),
(16, 3200.00, NOW() - INTERVAL '50 days'),
(21, 2700.00, NOW() - INTERVAL '120 days'),
(24, 3500.00, NOW() - INTERVAL '150 days'),
-- Very inactive customers (no orders → only sign-up date matters)
(36, 500.00,  NOW() - INTERVAL '180 days'),
(37, 200.00,  NOW() - INTERVAL '200 days'),
(38, 1000.00, NOW() - INTERVAL '160 days'),
(39, 300.00,  NOW() - INTERVAL '220 days'),
(40, 700.00,  NOW() - INTERVAL '190 days'),
(41, 1500.00, NOW() - INTERVAL '95 days'),
(42, 2000.00, NOW() - INTERVAL '100 days'),
(43, 1800.00, NOW() - INTERVAL '110 days'),
(44, 900.00,  NOW() - INTERVAL '130 days'),
(45, 400.00,  NOW() - INTERVAL '170 days');
