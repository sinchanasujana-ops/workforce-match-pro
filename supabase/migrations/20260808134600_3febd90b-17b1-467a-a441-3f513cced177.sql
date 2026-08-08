DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_type') THEN
    CREATE TYPE public.job_type AS ENUM ('full-time','part-time','daily-wage');
  END IF;
END $$;

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS job_type public.job_type NOT NULL DEFAULT 'full-time',
  ADD COLUMN IF NOT EXISTS monthly_pay integer NOT NULL DEFAULT 0;

INSERT INTO public.jobs (title, category, employer_name, location, wage, duration, description, skills, job_type, monthly_pay) VALUES
('Senior Electrician','skilled','Sunrise Constructions','Bengaluru, Karnataka','₹950 / day','6 months','Lead electrical installation for a residential complex of 4 towers.','{Wiring,"Panel installation","Safety certified"}','daily-wage',24000),
('Residential Plumber','skilled','GreenHomes Pvt Ltd','Pune, Maharashtra','₹800 / day','3 months','Plumbing work for villa project; daily wages plus food.','{"Pipe fitting","Bathroom fittings"}','daily-wage',20000),
('CNC Machine Operator','semi-skilled','Bharat Auto Parts','Chennai, Tamil Nadu','₹22,000 / month','Permanent','Operate CNC lathe in an auto parts manufacturing unit. Training provided.','{"CNC operation","Quality check"}','full-time',22000),
('Construction Helper','unskilled','Metro Infra','Hyderabad, Telangana','₹550 / day','8 months','Site helper for metro flyover project. Accommodation provided.','{"Hard working","Team player"}','daily-wage',14000),
('Tea Plantation Worker','unskilled','Hill Estate Co.','Munnar, Kerala','₹450 / day','Seasonal','Tea leaf plucking season. Housing and meals included.','{"Outdoor work"}','daily-wage',12000),
('Welder (Arc & MIG)','skilled','SteelWorks India','Surat, Gujarat','₹1,100 / day','4 months','Skilled welder needed for industrial fabrication project.','{"Arc welding",MIG,"Blueprint reading"}','daily-wage',28000),
('Heavy Truck Driver','semi-skilled','Shakti Logistics','Nagpur, Maharashtra','₹28,000 / month','Permanent','Interstate goods transport. Valid heavy vehicle licence required.','{"Heavy licence","Route planning"}','full-time',28000),
('Auto Rickshaw Driver','semi-skilled','CityRide Fleet','Bengaluru, Karnataka','₹19,000 / month','Permanent','Drive company-owned auto on city routes. Fuel allowance included.','{"City routes","Customer service"}','full-time',19000),
('Delivery Rider (Bike)','semi-skilled','QuickKart','Mumbai, Maharashtra','₹21,000 / month','Permanent','Last-mile delivery on two-wheeler. Incentives on every order.','{"Two-wheeler licence",Navigation}','full-time',21000),
('Part-time Delivery Executive','unskilled','FreshBasket','Delhi, NCR','₹250 / shift','Ongoing','Evening grocery deliveries, 4-hour shifts, flexible days.','{"Time management"}','part-time',9000),
('Security Guard (Day Shift)','unskilled','Sentinel Facility Services','Bengaluru, Karnataka','₹17,000 / month','Permanent','Gate duty and visitor register for an IT park.','{Alertness,"Register keeping"}','full-time',17000),
('Security Supervisor','semi-skilled','Sentinel Facility Services','Hyderabad, Telangana','₹24,000 / month','Permanent','Supervise a team of 8 guards across two shifts.','{Supervision,"Incident reporting"}','full-time',24000),
('Housekeeping Staff','unskilled','CleanPro Services','Chennai, Tamil Nadu','₹15,000 / month','Permanent','Housekeeping for corporate office floors.','{Cleaning,"Floor care"}','full-time',15000),
('Hotel Room Attendant','unskilled','Palm Grove Hotel','Goa','₹16,500 / month','Seasonal','Room cleaning and linen change for a beach resort.','{Housekeeping,"Guest care"}','full-time',16500),
('Cook (South Indian)','skilled','Annapurna Canteen','Mysuru, Karnataka','₹26,000 / month','Permanent','Prepare breakfast and lunch for a 300-seat canteen.','{"Bulk cooking","Menu planning",Hygiene}','full-time',26000),
('Kitchen Helper','unskilled','Annapurna Canteen','Mysuru, Karnataka','₹13,000 / month','Permanent','Vegetable cutting, dishwashing and kitchen cleaning.','{"Kitchen hygiene"}','full-time',13000),
('Tandoor Chef','skilled','Spice Route Restaurant','Delhi, NCR','₹32,000 / month','Permanent','Tandoor and grill section for a busy dine-in restaurant.','{Tandoor,"Indian breads"}','full-time',32000),
('Carpenter','skilled','WoodCraft Interiors','Jaipur, Rajasthan','₹900 / day','5 months','Modular furniture fitting for residential interiors.','{"Modular fitting","Hand tools"}','daily-wage',23000),
('Painter','semi-skilled','ColourHouse Painters','Ahmedabad, Gujarat','₹700 / day','2 months','Interior and exterior painting for apartment blocks.','{"Roller work",Putty}','daily-wage',18000),
('Tile Mason','skilled','Sunrise Constructions','Bengaluru, Karnataka','₹1,000 / day','4 months','Floor and wall tiling for premium apartments.','{Tiling,Levelling}','daily-wage',25000),
('Bar Bender','semi-skilled','Metro Infra','Kochi, Kerala','₹750 / day','7 months','Reinforcement steel bending and tying at bridge site.','{"Bar bending","Site safety"}','daily-wage',19000),
('Scaffolder','semi-skilled','BuildRight Projects','Vizag, Andhra Pradesh','₹800 / day','6 months','Erect and dismantle scaffolding at height. Safety gear provided.','{"Height work",Scaffolding}','daily-wage',20000),
('Construction Labour (Female)','unskilled','BuildRight Projects','Vizag, Andhra Pradesh','₹500 / day','6 months','General site labour with separate rest facilities.','{"Manual work"}','daily-wage',13000),
('Forklift Operator','semi-skilled','Warehouse One','Bhiwandi, Maharashtra','₹23,000 / month','Permanent','Operate forklift in a large distribution warehouse.','{"Forklift licence","Stock handling"}','full-time',23000),
('Loading & Unloading Worker','unskilled','Warehouse One','Bhiwandi, Maharashtra','₹600 / day','Ongoing','Load and unload trucks at the warehouse dock.','{"Physical fitness"}','daily-wage',15000),
('Packing Staff','unskilled','Shreeji Foods','Indore, Madhya Pradesh','₹14,000 / month','Permanent','Packing and labelling on a food production line.','{"Line work",Hygiene}','full-time',14000),
('Power Loom Operator','semi-skilled','Kaveri Textiles','Coimbatore, Tamil Nadu','₹20,000 / month','Permanent','Operate and monitor power looms on rotating shifts.','{"Loom operation","Shift work"}','full-time',20000),
('Tailor (Garment Unit)','skilled','Kaveri Textiles','Tiruppur, Tamil Nadu','₹21,000 / month','Permanent','Single-needle stitching for export garments.','{Stitching,"Quality check"}','full-time',21000),
('AC Technician','skilled','CoolAir Services','Bengaluru, Karnataka','₹27,000 / month','Permanent','Split AC installation and servicing at customer sites.','{"AC installation","Gas charging"}','full-time',27000),
('Two-Wheeler Mechanic','skilled','MotoFix Garage','Hubballi, Karnataka','₹22,000 / month','Permanent','Servicing and repair of bikes and scooters.','{"Engine repair",Diagnostics}','full-time',22000),
('Housekeeping Supervisor','semi-skilled','CleanPro Services','Bengaluru, Karnataka','₹22,000 / month','Permanent','Manage housekeeping rosters and supplies for a tech campus.','{Supervision,"Inventory basics"}','full-time',22000),
('Gardener','unskilled','Green Campus Facility','Bengaluru, Karnataka','₹15,500 / month','Permanent','Lawn care and plant maintenance in a corporate campus.','{Gardening,Watering}','full-time',15500),
('Farm Labour','unskilled','Sahyadri Agro Farms','Nashik, Maharashtra','₹480 / day','Seasonal','Grape harvesting and vineyard upkeep.','{"Field work"}','daily-wage',12500),
('Part-time House Help','unskilled','Urban Home Services','Pune, Maharashtra','₹300 / visit','Ongoing','Two-hour daily cleaning and utensil work in nearby homes.','{Cleaning,Punctuality}','part-time',9500),
('Office Boy / Peon','unskilled','Nirmal Corporate Services','Kolkata, West Bengal','₹14,500 / month','Permanent','Pantry, filing support and courier runs for an office.','{"Pantry work","Basic reading"}','full-time',14500),
('Crane Operator','skilled','Metro Infra','Hyderabad, Telangana','₹35,000 / month','Permanent','Operate tower crane at a high-rise construction site.','{"Crane licence","Load charts","Site safety"}','full-time',35000);