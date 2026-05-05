export type StageId = "APPLIED" | "SCREENING" | "INTERVIEW" | "OFFER" | "REJECTED";

export type CandidateApplication = {
  id: string;
  stage: StageId;
  source: string | null;
  notes: string | null;
  autoResponseAt: string | null;
  candidate: {
    name: string;
    email: string;
    phone: string | null;
    headline: string | null;
  };
  job: {
    title: string;
    department: string;
    location: string;
  };
};

export type PipelineStage = {
  id: StageId;
  label: string;
  applications: CandidateApplication[];
};

export const pipelineStages: PipelineStage[] = [
  {
    id: "APPLIED",
    label: "Applied",
    applications: [
      {
        id: "app-1",
        stage: "APPLIED",
        source: "LinkedIn",
        notes: null,
        autoResponseAt: new Date().toISOString(),
        candidate: {
          name: "Avery Chen",
          email: "avery@example.com",
          phone: null,
          headline: "Portfolio-heavy UX generalist"
        },
        job: {
          title: "Product Designer",
          department: "Design",
          location: "Remote"
        }
      },
      {
        id: "app-2",
        stage: "APPLIED",
        source: "Referral",
        notes: null,
        autoResponseAt: null,
        candidate: {
          name: "Riley Stone",
          email: "riley@example.com",
          phone: null,
          headline: "Research-led designer with startup pace"
        },
        job: {
          title: "Product Designer",
          department: "Design",
          location: "Remote"
        }
      }
    ]
  },
  {
    id: "SCREENING",
    label: "Screening",
    applications: [
      {
        id: "app-3",
        stage: "SCREENING",
        source: "Careers page",
        notes: null,
        autoResponseAt: new Date().toISOString(),
        candidate: {
          name: "Jordan Patel",
          email: "jordan@example.com",
          phone: null,
          headline: "Systems thinker with B2B SaaS background"
        },
        job: {
          title: "Product Designer",
          department: "Design",
          location: "Remote"
        }
      }
    ]
  },
  {
    id: "INTERVIEW",
    label: "Interview",
    applications: [
      {
        id: "app-4",
        stage: "INTERVIEW",
        source: "Inbound",
        notes: null,
        autoResponseAt: new Date().toISOString(),
        candidate: {
          name: "Sam Rivera",
          email: "sam@example.com",
          phone: null,
          headline: "Strong prototyping and research practice"
        },
        job: {
          title: "Product Designer",
          department: "Design",
          location: "Remote"
        }
      }
    ]
  },
  {
    id: "OFFER",
    label: "Offer",
    applications: [
      {
        id: "app-5",
        stage: "OFFER",
        source: "Agency",
        notes: null,
        autoResponseAt: new Date().toISOString(),
        candidate: {
          name: "Taylor Brooks",
          email: "taylor@example.com",
          phone: null,
          headline: "Senior designer ready for team leadership"
        },
        job: {
          title: "Product Designer",
          department: "Design",
          location: "Remote"
        }
      }
    ]
  },
  {
    id: "REJECTED",
    label: "Rejected",
    applications: [
      {
        id: "app-6",
        stage: "REJECTED",
        source: "Referral",
        notes: null,
        autoResponseAt: new Date().toISOString(),
        candidate: {
          name: "Morgan Lee",
          email: "morgan@example.com",
          phone: null,
          headline: "Great person, not the right role match"
        },
        job: {
          title: "Product Designer",
          department: "Design",
          location: "Remote"
        }
      }
    ]
  }
];
