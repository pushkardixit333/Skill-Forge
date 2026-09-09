require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/User");
const Provider = require("../models/Provider");
const Course = require("../models/Course");
const Employer = require("../models/Employer");
const Trainee = require("../models/Trainee");
const Placement = require("../models/Placement");
const EmploymentSpell = require("../models/EmploymentSpell");
const FollowUp = require("../models/FollowUp");
const { scheduleFollowUpsForPlacement } = require("../jobs/followupScheduler");

const DISTRICTS = [
  { state: "Madhya Pradesh", district: "Bhopal" },
  { state: "Madhya Pradesh", district: "Indore" },
  { state: "Uttar Pradesh", district: "Lucknow" },
  { state: "Bihar", district: "Patna" },
];

const NON_PLACEMENT_REASONS = [
  "skill_mismatch",
  "low_wage_expectations",
  "location_constraint",
  "personal_family_reason",
  "further_studies",
  "no_local_demand",
];

const ATTRITION_REASONS = ["better_opportunity", "low_wage", "workplace_issue", "location_relocation", "contract_ended"];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const run = async () => {
  await connectDB();
  console.log("Clearing existing demo data...");
  await Promise.all([
    User.deleteMany({}),
    Provider.deleteMany({}),
    Course.deleteMany({}),
    Employer.deleteMany({}),
    Trainee.deleteMany({}),
    Placement.deleteMany({}),
    EmploymentSpell.deleteMany({}),
    FollowUp.deleteMany({}),
  ]);

  console.log("Creating demo login...");
  await User.create({
    name: "Programme Admin",
    email: "admin@skillmission.gov.in",
    password: "password123",
    role: "admin",
  });

  console.log("Creating providers...");
  const providers = await Provider.insertMany(
    DISTRICTS.map((d, i) => ({
      name: `Govt ITI ${d.district}`,
      type: "iti",
      state: d.state,
      district: d.district,
      accreditationStatus: i % 3 === 0 ? "provisional" : "accredited",
      contactEmail: `iti.${d.district.toLowerCase()}@skillmission.gov.in`,
      contactPhone: `9${randInt(100000000, 999999999)}`,
    }))
  );

  console.log("Creating courses...");
  const courseDefs = [
    { name: "Electrician (Domestic)", sector: "Power", curriculumSkills: ["wiring", "safety", "meter reading"] },
    { name: "Web Development Fundamentals", sector: "IT-ITeS", curriculumSkills: ["HTML/CSS", "JavaScript", "Git"] },
    { name: "General Duty Assistant", sector: "Healthcare", curriculumSkills: ["patient care", "first aid", "hygiene"] },
    { name: "Retail Sales Associate", sector: "Retail", curriculumSkills: ["POS systems", "customer service"] },
    { name: "CNC Machine Operator", sector: "Manufacturing", curriculumSkills: ["CNC programming", "quality checks"] },
  ];
  const courses = await Course.insertMany(
    courseDefs.map((c) => ({ ...c, durationWeeks: randInt(6, 16), providerId: rand(providers)._id }))
  );

  console.log("Creating employers...");
  const employers = await Employer.insertMany(
    Array.from({ length: 12 }).map((_, i) => ({
      name: `${["Bright", "Metro", "Sunrise", "Prime", "Ganga", "Vindhya"][i % 6]} ${
        ["Electricals", "Retail Pvt Ltd", "Hospital", "Textiles", "Logistics", "Solutions"][i % 6]
      }`,
      sector: rand(["Power", "Retail", "Healthcare", "Manufacturing", "IT-ITeS"]),
      gstin: `23AAAAA${1000 + i}A1Z${i % 9}`,
      verificationStatus: rand(["unverified", "self_declared", "document_verified", "govt_database_verified"]),
      address: rand(DISTRICTS),
    }))
  );

  console.log("Creating trainees, placements, follow-ups and employment spells...");
  const genders = ["male", "female", "transgender"];
  const categories = ["general", "obc", "sc", "st", "ews"];

  for (let i = 0; i < 120; i++) {
    const loc = rand(DISTRICTS);
    const course = rand(courses);
    const enrollmentDate = daysAgo(randInt(200, 500));
    const completionStatus = rand(["completed", "completed", "completed", "dropped_out", "in_progress"]);

    const trainee = await Trainee.create({
      traineeCode: `TR-2025-${100000 + i}`,
      name: `Trainee ${i + 1}`,
      dob: daysAgo(randInt(6500, 10000)),
      gender: rand(genders),
      category: rand(categories),
      phone: `9${randInt(100000000, 999999999)}`,
      address: { ...loc, areaType: rand(["rural", "urban"]), pincode: `4${randInt(10000, 99999)}` },
      aadhaarLinked: Math.random() > 0.2,
      courseId: course._id,
      providerId: course.providerId,
      batchId: `B-${randInt(1, 6)}`,
      enrollmentDate,
      completionStatus,
      certificationDate: completionStatus === "completed" ? daysAgo(randInt(150, 300)) : undefined,
      baselineSkillLevel: rand(["beginner", "intermediate"]),
      consentLedger: [
        {
          action: "granted",
          scope: ["share_with_government", "followup_contact", "wage_verification"],
          channel: "portal",
          recordedAt: enrollmentDate,
        },
      ],
    });

    if (completionStatus !== "completed") continue; // only completed trainees get outcomes

    const outcomeRoll = Math.random();
    let placement;

    if (outcomeRoll < 0.6) {
      // wage employment
      placement = await Placement.create({
        traineeId: trainee._id,
        outcomeType: "wage_employment",
        employerId: rand(employers)._id,
        role: `${course.name} Trainee`,
        placementDate: daysAgo(randInt(100, 250)),
        initialWage: randInt(9000, 18000),
        source: rand(["campus_placement", "self_effort", "provider_referral"]),
        verificationStatus: rand(["self_reported", "employer_confirmed", "govt_database_verified"]),
      });
    } else if (outcomeRoll < 0.75) {
      // apprenticeship
      placement = await Placement.create({
        traineeId: trainee._id,
        outcomeType: "apprenticeship",
        employerId: rand(employers)._id,
        role: `${course.name} Apprentice`,
        placementDate: daysAgo(randInt(100, 250)),
        isApprenticeship: true,
        apprenticeshipStipend: randInt(6000, 10000),
        apprenticeshipConverted: Math.random() > 0.5,
        source: "provider_referral",
      });
    } else if (outcomeRoll < 0.88) {
      // self-employment
      placement = await Placement.create({
        traineeId: trainee._id,
        outcomeType: "self_employment",
        businessType: rand(["Electrical repair shop", "Tailoring unit", "Mobile repair kiosk", "Retail stall"]),
        udyamRegistered: Math.random() > 0.5,
        monthlyIncomeBand: rand(["below_5k", "5k_10k", "10k_20k", "20k_40k"]),
        schemeAvailed: Math.random() > 0.5 ? ["PMEGP"] : [],
        placementDate: daysAgo(randInt(100, 250)),
        source: "self_effort",
      });
    } else {
      // not placed
      placement = await Placement.create({
        traineeId: trainee._id,
        outcomeType: "not_placed",
        nonPlacementReason: rand(NON_PLACEMENT_REASONS),
      });
    }

    const followUps = await scheduleFollowUpsForPlacement(placement);

    // Simulate that earlier checkpoints (30, 90 day) have already completed,
    // generating historical EmploymentSpell + FollowUp response data.
    if (placement.outcomeType !== "not_placed") {
      for (const fu of followUps) {
        if (fu.checkpointDay > 180) continue; // leave later checkpoints pending
        const stillEmployed = Math.random() > 0.25;
        const wage =
          placement.initialWage
            ? placement.initialWage + fu.checkpointDay * randInt(2, 8)
            : placement.apprenticeshipStipend
            ? placement.apprenticeshipStipend + fu.checkpointDay * randInt(1, 5)
            : randInt(6000, 15000);

        await EmploymentSpell.create({
          traineeId: trainee._id,
          placementId: placement._id,
          checkpointDay: fu.checkpointDay,
          status: stillEmployed ? "active" : "exited",
          wage,
          exitReason: stillEmployed ? null : rand(ATTRITION_REASONS),
        });

        fu.status = "completed";
        fu.completedAt = daysAgo(randInt(1, 90));
        fu.handledBy = Math.random() > 0.7 ? "call_center_agent" : "system";
        fu.response = {
          currentlyEmployed: stillEmployed,
          currentWage: wage,
          stillWithSameEmployer: stillEmployed,
          satisfactionScore: randInt(2, 5),
          reasonForAttrition: stillEmployed ? undefined : rand(ATTRITION_REASONS),
        };
        await fu.save();
      }
    }
  }

  console.log("Seed complete.");
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
