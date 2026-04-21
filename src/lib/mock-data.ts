export type WorkerCategory = "skilled" | "semi-skilled" | "unskilled";

export type Job = {
  id: string;
  title: string;
  category: WorkerCategory;
  employer: string;
  location: string;
  wage: string;
  duration: string;
  matchScore: number;
  skills: string[];
  postedAgo: string;
  description: string;
};

export const MOCK_JOBS: Job[] = [
  {
    id: "j1",
    title: "Senior Electrician",
    category: "skilled",
    employer: "Sunrise Constructions",
    location: "Bengaluru, Karnataka",
    wage: "₹950 / day",
    duration: "6 months",
    matchScore: 96,
    skills: ["Wiring", "Panel installation", "Safety certified"],
    postedAgo: "2h ago",
    description: "Lead electrical installation for a residential complex of 4 towers.",
  },
  {
    id: "j2",
    title: "Plumber",
    category: "skilled",
    employer: "GreenHomes Pvt Ltd",
    location: "Pune, Maharashtra",
    wage: "₹800 / day",
    duration: "3 months",
    matchScore: 91,
    skills: ["Pipe fitting", "Bathroom fittings"],
    postedAgo: "5h ago",
    description: "Plumbing work for villa project; daily wages plus food.",
  },
  {
    id: "j3",
    title: "CNC Machine Operator",
    category: "semi-skilled",
    employer: "Bharat Auto Parts",
    location: "Chennai, Tamil Nadu",
    wage: "₹22,000 / month",
    duration: "Permanent",
    matchScore: 88,
    skills: ["CNC operation", "Quality check"],
    postedAgo: "1d ago",
    description: "Operate CNC lathe in auto parts manufacturing unit. Training provided.",
  },
  {
    id: "j4",
    title: "Construction Helper",
    category: "unskilled",
    employer: "Metro Infra",
    location: "Hyderabad, Telangana",
    wage: "₹550 / day",
    duration: "8 months",
    matchScore: 84,
    skills: ["Hard working", "Team player"],
    postedAgo: "1d ago",
    description: "Site helper for metro flyover project. Accommodation provided.",
  },
  {
    id: "j5",
    title: "Tea Plantation Worker",
    category: "unskilled",
    employer: "Hill Estate Co.",
    location: "Munnar, Kerala",
    wage: "₹450 / day",
    duration: "Seasonal",
    matchScore: 79,
    skills: ["Outdoor work"],
    postedAgo: "3d ago",
    description: "Tea leaf plucking season. Housing and meals included.",
  },
  {
    id: "j6",
    title: "Welder (Arc & MIG)",
    category: "skilled",
    employer: "SteelWorks India",
    location: "Surat, Gujarat",
    wage: "₹1,100 / day",
    duration: "4 months",
    matchScore: 93,
    skills: ["Arc welding", "MIG", "Blueprint reading"],
    postedAgo: "6h ago",
    description: "Skilled welder needed for industrial fabrication project.",
  },
];

export const CATEGORIES: Array<{
  value: WorkerCategory;
  label: string;
  description: string;
  examples: string;
}> = [
  { value: "skilled", label: "Skilled", description: "Trained workers with certified expertise", examples: "Electrician, Plumber, Welder, Carpenter" },
  { value: "semi-skilled", label: "Semi-Skilled", description: "Workers with on-the-job training", examples: "Machine operator, Driver, Helper" },
  { value: "unskilled", label: "Unskilled", description: "General labour, no formal training needed", examples: "Construction, Plantation, Loading" },
];